import type { InventoryRecord, Item } from '@/features/inventory/types'
import type { DemandLine } from '@/features/orders/types'
import type { PurchaseOrder, ShortageLine } from '@/features/purchase/types'
import {
  calculateAvailableStock,
  findInventoryRecord,
} from '@/domain/inventory/calculateAvailableStock'

/** 아직 물건이 들어올 여지가 있는 발주 상태 */
const INCOMING_STATUSES = new Set<PurchaseOrder['status']>([
  'DRAFT',
  'ORDERED',
  'PARTIALLY_RECEIVED',
])

/** 발주 완료·미입고 수량 (품목 × 창고) */
export function calculateIncoming(
  purchaseOrders: readonly PurchaseOrder[],
  itemId: string,
  warehouseId: string,
): number {
  return purchaseOrders
    .filter((po) => po.warehouseId === warehouseId && INCOMING_STATUSES.has(po.status))
    .flatMap((po) => po.lines)
    .filter((line) => line.itemId === itemId)
    .reduce((acc, line) => acc + Math.max(0, line.quantity - line.receivedQuantity), 0)
}

export interface CalculateShortageInput {
  items: readonly Item[]
  inventory: readonly InventoryRecord[]
  purchaseOrders: readonly PurchaseOrder[]
  /** 번들이 전개된 실물 품목 소요량 */
  demand: readonly DemandLine[]
  warehouseId: string
}

/**
 * 부족분 = 소요량 + 안전재고 - 가용재고 - 입고예정.
 *
 * 안전재고를 더하는 이유: 수주를 다 채우고 나면 재고가 0 이 되는 발주는
 * 다음 주문을 바로 결품으로 만든다. 입고예정을 빼는 이유: 이미 발주한 물량을
 * 또 발주하면 과잉재고가 된다.
 */
export function calculateShortage({
  items,
  inventory,
  purchaseOrders,
  demand,
  warehouseId,
}: CalculateShortageInput): ShortageLine[] {
  const byId = new Map(items.map((item) => [item.id, item]))

  return (
    demand
      .map<ShortageLine>((line) => {
        const item = byId.get(line.itemId)
        const record = findInventoryRecord(inventory, line.itemId, warehouseId)
        const available = calculateAvailableStock(record)
        const incoming = calculateIncoming(purchaseOrders, line.itemId, warehouseId)
        const safetyStock = item?.safetyStock ?? 0

        return {
          itemId: line.itemId,
          warehouseId,
          required: line.quantity,
          available,
          incoming,
          safetyStock,
          shortage: Math.max(0, line.quantity + safetyStock - available - incoming),
        }
      })
      // 번들은 재고를 갖지 않으므로 전개 결과에 남아 있으면 안 된다
      .filter((line) => byId.get(line.itemId)?.type !== 'BUNDLE')
      .filter((line) => line.shortage > 0)
      .sort((a, b) => b.shortage - a.shortage)
  )
}
