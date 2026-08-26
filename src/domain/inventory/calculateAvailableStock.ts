import type { InventoryRecord } from '@/features/inventory/types'

/**
 * 가용 재고 = 실물 재고 - 예약 수량.
 * 예약분은 이미 다른 수주가 가져간 몫이므로 신규 수주에 쓸 수 없다.
 */
export function calculateAvailableStock(record: InventoryRecord | undefined): number {
  if (!record) return 0
  return Math.max(0, record.onHand - record.reserved)
}

/** 특정 품목 × 창고의 재고 레코드를 찾는다 */
export function findInventoryRecord(
  records: readonly InventoryRecord[],
  itemId: string,
  warehouseId: string,
): InventoryRecord | undefined {
  return records.find((record) => record.itemId === itemId && record.warehouseId === warehouseId)
}

/** 특정 품목 × 창고의 가용 재고 */
export function availableStockOf(
  records: readonly InventoryRecord[],
  itemId: string,
  warehouseId: string,
): number {
  return calculateAvailableStock(findInventoryRecord(records, itemId, warehouseId))
}
