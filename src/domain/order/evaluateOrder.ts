import type {
  ErpDatabase,
  Order,
  OrderPreparation,
  PreparationBlock,
  PreparationItem,
  PreparationStatus,
} from '@/types'
import { availableQuantityOf } from '@/domain/inventory/getAvailableQuantity'
import { findWarehouse, isActiveWarehouse } from '@/domain/master/warehouseRules'
import {
  calculateIncomingQuantity,
  documentIdsOf,
  findIncomingDocuments,
  resolveWaitingReason,
} from '@/domain/purchase/getRemainingQuantity'
import { calculateOrderDemand } from './calculateDemand'

export type EvaluateOrderContext = Pick<
  ErpDatabase,
  'items' | 'bundleComponents' | 'warehouses' | 'inventories' | 'incomingDocuments'
>

/**
 * 새 출고 준비 대상인가 (00_안내: 주문 확정 상태의 정상 품목만 대상).
 *
 * 목록 화면은 이 함수로 먼저 걸러야 한다. 완료·취소 주문까지 evaluateOrder 에 넣으면
 * ORDER_NOT_CONFIRMED 로 INVALID 가 되어, 데이터 오류(미등록 품목·사용 중지 창고)와
 * 한 덩어리로 보이게 된다.
 */
export const isPreparationTarget = (order: Order): boolean => order.status === '주문 확정'

/** 나쁜 순서. 주문 상태는 품목 중 가장 나쁜 것을 따른다. */
const SEVERITY: Record<PreparationStatus, number> = {
  READY: 0,
  WAITING: 1,
  SHORTAGE: 2,
  INVALID: 3,
}

const worst = (statuses: readonly PreparationStatus[]): PreparationStatus =>
  statuses.reduce<PreparationStatus>(
    (acc, status) => (SEVERITY[status] > SEVERITY[acc] ? status : acc),
    'READY',
  )

const invalidItem = (itemCode: string, requiredQuantity: number): PreparationItem => ({
  itemCode,
  requiredQuantity,
  availableQuantity: 0,
  incomingQuantity: 0,
  shortageQuantity: requiredQuantity,
  status: 'INVALID',
  incomingDocumentIds: [],
})

const blocked = (orderId: string, blocks: PreparationBlock[]): OrderPreparation => ({
  orderId,
  status: 'INVALID',
  items: [],
  excludedItemCodes: [],
  blockingReasons: blocks,
})

/**
 * 주문 하나의 출고 준비 가능 여부를 판정한다. 이 프로젝트의 중심 함수다.
 *
 * 판정 순서에는 이유가 있다.
 *  1) 주문상태 — '주문 확정' 이 아니면 애초에 준비 대상이 아니다 (00_안내)
 *  2) 출고창고 — 사용 중지 창고에서는 어떤 품목도 낼 수 없다. 이 경우 품목 명세를
 *     같이 보여주면 'WH-LEGACY 에 5개 있음' 처럼 오해를 부르므로 조기 반환한다.
 *  3) 품목 — 세트를 풀고, 서비스를 빼고, 남은 실물만 재고와 맞춰본다
 *
 * 주문 상태는 품목 중 가장 나쁜 것으로 정한다. 한 주문은 필요한 모든 품목을 준비할 수
 * 있을 때만 예약하므로 (00_안내), 하나라도 모자라면 주문 전체가 READY 가 아니다.
 */
export function evaluateOrder(ctx: EvaluateOrderContext, order: Order): OrderPreparation {
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
  const blocks: PreparationBlock[] = []
  const items: PreparationItem[] = []

  // 미등록 품목·잘못된 수량은 판정 자체가 불가능하다. 목록에는 INVALID 로 남겨
  // 어느 품목이 문제인지 화면에서 바로 보이게 한다.
  for (const itemCode of demand.unknownItemCodes) {
    const requested = order.items.find((item) => item.itemCode === itemCode)
    blocks.push({ code: 'UNKNOWN_ITEM', message: '등록되지 않은 품목입니다.', itemCode })
    items.push(invalidItem(itemCode, requested?.quantity ?? 0))
  }

  for (const itemCode of demand.invalidQuantityItemCodes) {
    blocks.push({ code: 'INVALID_QUANTITY', message: '주문 수량이 0 이하입니다.', itemCode })
    items.push(invalidItem(itemCode, 0))
  }

  for (const line of demand.lines) {
    const availableQuantity = availableQuantityOf(
      ctx.inventories,
      line.itemCode,
      order.warehouseCode,
    )
    const documents = findIncomingDocuments(ctx, line.itemCode, order.warehouseCode)
    const incomingQuantity = calculateIncomingQuantity(ctx, line.itemCode, order.warehouseCode)
    const shortageQuantity = Math.max(0, line.quantity - availableQuantity)

    const status: PreparationStatus =
      shortageQuantity === 0
        ? 'READY'
        : shortageQuantity <= incomingQuantity
          ? 'WAITING'
          : 'SHORTAGE'

    items.push({
      itemCode: line.itemCode,
      requiredQuantity: line.quantity,
      availableQuantity,
      incomingQuantity,
      shortageQuantity,
      status,
      // WAITING 일 때만 대기 원인이 의미를 갖는다
      ...(status === 'WAITING' ? { waitingReason: resolveWaitingReason(documents) } : {}),
      incomingDocumentIds: status === 'READY' ? [] : documentIdsOf(documents),
    })
  }

  if (items.length === 0) {
    blocks.push({
      code: 'NO_DEMAND',
      message: '재고를 준비할 품목이 없습니다. 취소 품목이거나 서비스 항목만 있습니다.',
    })
  }

  return {
    orderId: order.orderId,
    status: blocks.length > 0 ? 'INVALID' : worst(items.map((item) => item.status)),
    items,
    excludedItemCodes: demand.excludedItemCodes,
    blockingReasons: blocks,
  }
}

/** 준비 판정이 READY 인 주문만 예약할 수 있다 (00_안내: 전량 준비 가능할 때만 예약) */
export const canReserve = (preparation: OrderPreparation): boolean => preparation.status === 'READY'
