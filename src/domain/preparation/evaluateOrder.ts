import type {
  ErpDatabase,
  ItemCode,
  Order,
  OrderPreparation,
  PreparationBlock,
  PreparationItem,
  Quantity,
} from '@/types'
import { calculateOrderDemand } from '@/domain/order/calculateDemand'
import { findWarehouse, isActiveWarehouse } from '@/domain/master/warehouseRules'
import { documentIdsOf, resolveWaitingReason } from '@/domain/purchase/getRemainingQuantity'
import { commit, createAllocationLedger, simulate, type AllocationLedger } from './allocationLedger'
import { isPreparationTarget, worstStatus } from './preparationRules'

export type EvaluateOrderContext = Pick<
  ErpDatabase,
  'items' | 'bundleComponents' | 'warehouses' | 'inventories' | 'incomingDocuments'
>

/** 판정 불가 품목 — 숫자를 채우지 않는다. 계산 자체가 성립하지 않는 상태다. */
const exceptionItem = (itemCode: ItemCode, requiredQuantity: Quantity): PreparationItem => ({
  itemCode,
  requiredQuantity,
  availableQuantity: 0,
  incomingQuantity: 0,
  allocatedFromStock: 0,
  allocatedFromIncoming: 0,
  shortageQuantity: requiredQuantity,
  status: 'EXCEPTION',
  incomingDocumentIds: [],
})

const blocked = (
  orderId: string,
  blocks: PreparationBlock[],
  items: PreparationItem[] = [],
): OrderPreparation => ({
  orderId,
  status: 'EXCEPTION',
  items,
  excludedItemCodes: [],
  blockingReasons: blocks,
})

/**
 * 주문 하나의 출고 준비 가능 여부를 판정한다. 이 프로젝트의 중심 함수다.
 *
 * 판정 순서에는 이유가 있다.
 *  1) 주문상태 — '주문 확정' 이 아니면 애초에 준비 대상이 아니다 (00_안내)
 *  2) 출고창고 — 사용 중지 창고에서는 어떤 품목도 낼 수 없다
 *  3) 데이터 오류 — 미등록 품목·수량 오류·세트 구성 오류는 판정 자체가 불가능하다
 *  4) 품목 — 세트를 풀고, 서비스를 빼고, 남은 실물만 원장과 맞춰본다
 *
 * EXCEPTION 으로 끝나는 2·3 단계에서는 품목별 숫자를 내지 않는다. 사용 중지 창고 주문에
 * 'WH-LEGACY 에 5개 있음' 을 같이 띄우면 낼 수 있다는 오해를 부른다. 자동 처리 대상이
 * 아니라는 것과 어디가 막혔는지만 알려주면 된다 (가이드 §19).
 *
 * 그리고 EXCEPTION 주문은 재고를 한 개도 잡지 않는다. 원장을 건드리는 것은 4단계뿐이다.
 *
 * `ledger` 를 넘기지 않으면 이 주문 하나만 있는 것처럼 판정한다 — 창고의 가용재고 전부를
 * 이 주문이 쓸 수 있다고 본다. 목록 화면은 반드시 planPreparation 을 거쳐야 한다.
 * 주문마다 원장을 새로 만들면 같은 재고를 여러 주문이 각각 쓸 수 있다고 판정한다.
 */
export const evaluateOrder = (
  ctx: EvaluateOrderContext,
  order: Order,
  ledger: AllocationLedger = createAllocationLedger(ctx),
): OrderPreparation => {
  if (!isPreparationTarget(order)) {
    return blocked(order.orderId, [
      {
        code: 'ORDER_NOT_CONFIRMED',
        message: `주문상태가 '${order.status}' 여서 출고 준비 대상이 아닙니다.`,
      },
    ])
  }

  const warehouse = findWarehouse(ctx.warehouses, order.warehouseCode)
  if (!warehouse) {
    return blocked(order.orderId, [
      {
        code: 'UNKNOWN_WAREHOUSE',
        message: `등록되지 않은 출고창고입니다. (${order.warehouseCode})`,
      },
    ])
  }
  if (!isActiveWarehouse(warehouse)) {
    return blocked(order.orderId, [
      {
        code: 'INACTIVE_WAREHOUSE',
        message: `출고창고가 사용 중지된 창고입니다. (${warehouse.warehouseName})`,
      },
    ])
  }

  const demand = calculateOrderDemand(ctx, order)
  const requestedQuantityOf = (itemCode: ItemCode): Quantity =>
    order.items.find((item) => item.itemCode === itemCode)?.quantity ?? 0

  const blocks: PreparationBlock[] = []
  const problems: PreparationItem[] = []

  for (const itemCode of demand.unknownItemCodes) {
    blocks.push({
      code: 'UNKNOWN_ITEM',
      message: `품목코드 ${itemCode} 이(가) 등록되지 않은 품목입니다.`,
      itemCode,
    })
    problems.push(exceptionItem(itemCode, requestedQuantityOf(itemCode)))
  }

  for (const itemCode of demand.invalidQuantityItemCodes) {
    blocks.push({ code: 'INVALID_QUANTITY', message: '주문 수량이 0 이하입니다.', itemCode })
    problems.push(exceptionItem(itemCode, 0))
  }

  for (const itemCode of demand.cyclicItemCodes) {
    blocks.push({
      code: 'BUNDLE_CYCLE',
      message: `세트상품 ${itemCode} 의 구성이 자기 자신을 포함해 전개할 수 없습니다.`,
      itemCode,
    })
    problems.push(exceptionItem(itemCode, requestedQuantityOf(itemCode)))
  }

  for (const itemCode of demand.emptyBundleItemCodes) {
    blocks.push({
      code: 'BUNDLE_EMPTY',
      message: `세트상품 ${itemCode} 의 구성품이 등록되지 않았습니다.`,
      itemCode,
    })
    problems.push(exceptionItem(itemCode, requestedQuantityOf(itemCode)))
  }

  // 데이터 오류가 하나라도 있으면 재고를 건드리지 않고 되돌린다.
  // 정상 품목까지 배정하면, 담당자가 데이터를 고쳐 다시 판정할 때 이미 자기 몫을
  // 잡아버린 상태가 되어 부족분이 실제보다 작게 나온다.
  if (blocks.length > 0) return blocked(order.orderId, blocks, problems)

  if (demand.lines.length === 0) {
    return blocked(order.orderId, [
      {
        code: 'NO_DEMAND',
        message: '재고를 준비할 품목이 없습니다. 취소 품목이거나 서비스 항목만 있습니다.',
      },
    ])
  }

  // 먼저 전부 계산만 한다. 원장에 반영하는 것은 주문 전체의 판정이 끝난 뒤다.
  const allocations = demand.lines.map((line) =>
    simulate(ledger, line.itemCode, order.warehouseCode, line.quantity, order.deliveryDate),
  )

  const items = demand.lines.map<PreparationItem>((line, index) => {
    const allocation = allocations[index]!

    const status =
      allocation.shortageQuantity > 0
        ? 'SHORTAGE'
        : allocation.allocatedFromIncoming > 0
          ? 'WAITING'
          : 'READY'

    return {
      itemCode: line.itemCode,
      requiredQuantity: line.quantity,
      availableQuantity: allocation.availableQuantity,
      incomingQuantity: allocation.incomingQuantity,
      allocatedFromStock: allocation.allocatedFromStock,
      allocatedFromIncoming: allocation.allocatedFromIncoming,
      shortageQuantity: allocation.shortageQuantity,
      status,
      // WAITING 일 때만 대기 원인이 의미를 갖는다
      ...(status === 'WAITING'
        ? { waitingReason: resolveWaitingReason(allocation.documents) }
        : {}),
      incomingDocumentIds: documentIdsOf(allocation.documents),
    }
  })

  const status = worstStatus(items.map((item) => item.status))

  /*
   * 재고 부족 주문은 아무것도 잡지 않는다.
   *
   * "일부 품목만 가능하다면 그 주문의 일부 수량을 먼저 잡아두지 않습니다" 는 예약뿐
   * 아니라 판정에도 적용된다. 부족한 주문이 절반을 붙잡으면, 그 재고로 전량 준비할 수
   * 있었던 뒤 주문까지 함께 막힌다.
   */
  if (status !== 'SHORTAGE') commit(ledger, allocations)

  return {
    orderId: order.orderId,
    status,
    items,
    excludedItemCodes: demand.excludedItemCodes,
    blockingReasons: [],
  }
}
