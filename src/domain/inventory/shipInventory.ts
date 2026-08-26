import type { DemandLine } from '@/features/orders/types'
import type { InventoryRecord } from '@/features/inventory/types'
import { findInventoryRecord } from './calculateAvailableStock'

export interface ShipInventoryInput {
  records: readonly InventoryRecord[]
  warehouseId: string
  /** 출고할 실물 품목 수량 (예약된 수량과 같아야 한다) */
  shipment: readonly DemandLine[]
  updatedAt: string
}

export interface ShipInventoryResult {
  records: InventoryRecord[]
  /** 예약보다 많이 나가려 한 라인 — 호출부가 출하를 막는 근거로 쓴다 */
  violations: { itemId: string; requested: number; reserved: number }[]
}

/**
 * 출하: 실물 재고와 예약을 같은 수량만큼 함께 줄인다.
 *
 * 예약을 거치지 않은 출하는 허용하지 않는다. 예약분을 넘는 요청은 violations 로 보고하고
 * 해당 라인은 건드리지 않는다 — 부분 반영으로 재고가 깨지는 것보다 낫다.
 */
export function shipInventory({
  records,
  warehouseId,
  shipment,
  updatedAt,
}: ShipInventoryInput): ShipInventoryResult {
  const violations: ShipInventoryResult['violations'] = []

  for (const line of shipment) {
    const record = findInventoryRecord(records, line.itemId, warehouseId)
    const reserved = record?.reserved ?? 0
    if (line.quantity > reserved) {
      violations.push({ itemId: line.itemId, requested: line.quantity, reserved })
    }
  }

  if (violations.length > 0) return { records: [...records], violations }

  const nextRecords = records.map((record) => {
    if (record.warehouseId !== warehouseId) return record

    const line = shipment.find((item) => item.itemId === record.itemId)
    if (!line || line.quantity <= 0) return record

    return {
      ...record,
      onHand: Math.max(0, record.onHand - line.quantity),
      reserved: Math.max(0, record.reserved - line.quantity),
      updatedAt,
    }
  })

  return { records: nextRecords, violations }
}
