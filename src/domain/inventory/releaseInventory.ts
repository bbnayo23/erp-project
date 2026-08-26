import type { DemandLine } from '@/features/orders/types'
import type { InventoryRecord } from '@/features/inventory/types'

export interface ReleaseInventoryInput {
  records: readonly InventoryRecord[]
  warehouseId: string
  /** 풀어줄 예약 수량 (수주 취소 시 예약된 만큼) */
  reserved: readonly DemandLine[]
  updatedAt: string
}

/**
 * 예약을 해제한다 (수주 취소·수량 축소).
 *
 * reserved 가 음수로 내려가지 않도록 방어한다 — 중복 취소가 들어와도
 * 재고가 부풀지 않는다. 멱등성 로그와 이중 방어선을 이룬다.
 */
export function releaseInventory({
  records,
  warehouseId,
  reserved,
  updatedAt,
}: ReleaseInventoryInput): InventoryRecord[] {
  return records.map((record) => {
    if (record.warehouseId !== warehouseId) return record

    const target = reserved.find((line) => line.itemId === record.itemId)
    if (!target || target.quantity <= 0) return record

    const next = Math.max(0, record.reserved - target.quantity)
    if (next === record.reserved) return record

    return { ...record, reserved: next, updatedAt }
  })
}
