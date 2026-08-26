import type {
  ErpDatabase,
  ItemCode,
  Order,
  OrderId,
  OrderPreparation,
  Quantity,
  WarehouseCode,
} from '@/types'
import { availableQuantityOf } from '@/domain/inventory/getAvailableQuantity'
import { calculateIncomingQuantity } from './getRemainingQuantity'

export type ShortageContext = Pick<ErpDatabase, 'inventories' | 'incomingDocuments'>

export interface ShortageLine {
  itemCode: ItemCode
  warehouseCode: WarehouseCode
  /** 이 창고에서 대기 중인 주문들이 요구하는 합계 */
  requiredQuantity: Quantity
  availableQuantity: Quantity
  incomingQuantity: Quantity
  /** max(0, 소요합계 - 가용재고 - 입고예정) */
  shortageQuantity: Quantity
  /** 이 부족분에 걸려 있는 주문들 — 발주 문서에 되짚을 근거가 된다 */
  orderIds: OrderId[]
}

export interface ShortageInput {
  order: Order
  preparation: OrderPreparation
}

/**
 * 발주가 필요한 순수 부족분.
 *
 * 주문별 부족분을 그냥 더하면 안 된다. 가용재고 1개를 두 주문이 각각 1개씩 필요로 하면
 * 주문별 부족은 0 + 0 이지만 실제로는 1개가 모자라다. 그래서 품목 × 창고 단위로
 * 소요량을 먼저 합치고, 가용재고와 입고예정은 한 번만 뺀다.
 *
 * INVALID 주문은 제외한다 — 미등록 품목이나 사용 중지 창고는 발주로 해결되지 않는다.
 */
export function calculateShortage(
  ctx: ShortageContext,
  inputs: readonly ShortageInput[],
): ShortageLine[] {
  const required = new Map<string, { quantity: Quantity; orderIds: Set<OrderId> }>()

  for (const { order, preparation } of inputs) {
    if (preparation.status === 'INVALID') continue

    for (const item of preparation.items) {
      if (item.status === 'INVALID') continue

      const key = `${item.itemCode}@${order.warehouseCode}`
      const bucket = required.get(key)
      if (bucket) {
        bucket.quantity += item.requiredQuantity
        bucket.orderIds.add(order.orderId)
      } else {
        required.set(key, {
          quantity: item.requiredQuantity,
          orderIds: new Set([order.orderId]),
        })
      }
    }
  }

  return [...required]
    .map<ShortageLine>(([key, bucket]) => {
      const [itemCode = '', warehouseCode = ''] = key.split('@')
      const availableQuantity = availableQuantityOf(ctx.inventories, itemCode, warehouseCode)
      const incomingQuantity = calculateIncomingQuantity(ctx, itemCode, warehouseCode)

      return {
        itemCode,
        warehouseCode,
        requiredQuantity: bucket.quantity,
        availableQuantity,
        incomingQuantity,
        shortageQuantity: Math.max(0, bucket.quantity - availableQuantity - incomingQuantity),
        orderIds: [...bucket.orderIds],
      }
    })
    .filter((line) => line.shortageQuantity > 0)
    .sort((a, b) => b.shortageQuantity - a.shortageQuantity)
}
