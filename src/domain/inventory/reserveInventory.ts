import type { AllocationLine, AllocationResult, DemandLine } from '@/features/orders/types'
import type { InventoryRecord } from '@/features/inventory/types'
import { calculateAvailableStock, findInventoryRecord } from './calculateAvailableStock'

export interface ReserveInventoryInput {
  records: readonly InventoryRecord[]
  warehouseId: string
  /** 번들이 전개된 실물 품목 소요량 */
  demand: readonly DemandLine[]
  /** reserved 를 늘린 레코드의 updatedAt 으로 쓴다 */
  updatedAt: string
}

export interface ReserveInventoryResult {
  records: InventoryRecord[]
  allocation: AllocationResult
}

/**
 * 가용 재고 범위 안에서 최대한 예약한다(부분 예약 허용).
 *
 * 부족해도 실패시키지 않는 이유: ERP 실무에서는 일단 잡히는 만큼 잡아두고
 * 부족분을 발주로 넘기는 흐름이 기본이다. 부족분은 allocation.lines[].shortage 로 나간다.
 * 입력 records 는 변경하지 않고 새 배열을 반환한다.
 */
export function reserveInventory({
  records,
  warehouseId,
  demand,
  updatedAt,
}: ReserveInventoryInput): ReserveInventoryResult {
  let nextRecords: InventoryRecord[] = [...records]
  const lines: AllocationLine[] = []

  for (const line of demand) {
    const current = findInventoryRecord(nextRecords, line.itemId, warehouseId)
    const available = calculateAvailableStock(current)
    const allocated = Math.min(available, line.quantity)

    lines.push({
      itemId: line.itemId,
      required: line.quantity,
      allocated,
      shortage: line.quantity - allocated,
    })

    if (allocated <= 0) continue

    if (current) {
      nextRecords = nextRecords.map((record) =>
        record === current
          ? { ...record, reserved: record.reserved + allocated, updatedAt }
          : record,
      )
    } else {
      // 레코드가 없으면 가용 0 → allocated 0 이라 여기까지 오지 않는다
      nextRecords = [
        ...nextRecords,
        { itemId: line.itemId, warehouseId, onHand: 0, reserved: allocated, updatedAt },
      ]
    }
  }

  return {
    records: nextRecords,
    allocation: {
      lines,
      fullyAllocated: lines.length > 0 && lines.every((line) => line.shortage === 0),
      nothingAllocated: lines.every((line) => line.allocated === 0),
    },
  }
}
