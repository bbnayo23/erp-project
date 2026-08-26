import type { ItemCode, OrderId, Quantity, WarehouseCode } from '@/types'
import type { PreparationPlan } from '@/domain/preparation/planPreparation'
import { ledgerKey } from '@/domain/preparation/allocationLedger'

export interface ShortageLine {
  itemCode: ItemCode
  warehouseCode: WarehouseCode
  /** 부족을 낸 주문들의 소요 합계 — 이 창고에서 이 품목이 얼마나 필요했는지 */
  requiredQuantity: Quantity
  /** 발주해야 하는 수량 */
  shortageQuantity: Quantity
  /** 이 부족분에 걸려 있는 주문들 — 발주 문서에 되짚을 근거가 된다 */
  orderIds: OrderId[]
}

/**
 * 발주가 필요한 순수 부족분 (가이드 §14.1).
 *
 * 계획(planPreparation)을 입력으로 받는다. 재고에서 다시 계산하지 않는 것이 핵심이다.
 *
 * 주문별 부족분을 그냥 더하면 틀린다. 가용재고 1개를 두 주문이 각각 1개씩 필요로 하면
 * 주문별 부족은 0 + 0 이지만 실제로는 1개가 모자라다. 반대로 재고를 여기서 다시 빼면
 * 이미 배정된 몫을 두 번 빼게 된다.
 *
 * 계획은 배송일 순서대로 원장을 차감하며 만들어졌으므로, 각 주문의 부족분은 서로 겹치지
 * 않는다 — 앞 주문이 가져간 재고는 뒤 주문의 부족분에 이미 반영돼 있다. 그래서 여기서는
 * 그냥 더하면 된다. 뺄 것이 남아 있지 않다.
 *
 * EXCEPTION 은 제외한다. 미등록 품목이나 사용 중지 창고는 발주로 해결되지 않는다 (§19).
 */
export function calculateShortage(plan: PreparationPlan): ShortageLine[] {
  const buckets = new Map<
    string,
    {
      itemCode: ItemCode
      warehouseCode: WarehouseCode
      requiredQuantity: Quantity
      shortageQuantity: Quantity
      orderIds: Set<OrderId>
    }
  >()

  for (const { order, preparation } of plan.entries) {
    if (preparation.status === 'EXCEPTION') continue

    for (const item of preparation.items) {
      if (item.status === 'EXCEPTION') continue
      if (item.shortageQuantity <= 0) continue

      const key = ledgerKey(item.itemCode, order.warehouseCode)
      const bucket = buckets.get(key)

      if (bucket) {
        bucket.requiredQuantity += item.requiredQuantity
        bucket.shortageQuantity += item.shortageQuantity
        bucket.orderIds.add(order.orderId)
      } else {
        buckets.set(key, {
          itemCode: item.itemCode,
          warehouseCode: order.warehouseCode,
          requiredQuantity: item.requiredQuantity,
          shortageQuantity: item.shortageQuantity,
          orderIds: new Set([order.orderId]),
        })
      }
    }
  }

  return [...buckets.values()]
    .map<ShortageLine>((bucket) => ({
      itemCode: bucket.itemCode,
      warehouseCode: bucket.warehouseCode,
      requiredQuantity: bucket.requiredQuantity,
      shortageQuantity: bucket.shortageQuantity,
      orderIds: [...bucket.orderIds],
    }))
    .sort((a, b) => b.shortageQuantity - a.shortageQuantity || a.itemCode.localeCompare(b.itemCode))
}
