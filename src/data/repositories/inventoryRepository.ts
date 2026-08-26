import type { InventoryDelta, InventoryRecord, Item, Warehouse } from '@/features/inventory/types'

/**
 * 재고 컬렉션 접근 계층.
 *
 * 인메모리 배열을 다루지만 시그니처는 "컬렉션을 받아 새 컬렉션을 돌려준다" 로 고정한다.
 * 나중에 실제 API 로 바꿀 때 이 파일만 async 로 바꾸면 되고, 지금은 도메인 함수와
 * 마찬가지로 순수하게 유지돼 스토어가 예측 가능해진다.
 */
export const inventoryRepository = {
  find(
    records: readonly InventoryRecord[],
    itemId: string,
    warehouseId: string,
  ): InventoryRecord | undefined {
    return records.find((record) => record.itemId === itemId && record.warehouseId === warehouseId)
  },

  /** 레코드가 없으면 만들고, 있으면 갈아끼운다 */
  upsert(records: readonly InventoryRecord[], next: InventoryRecord): InventoryRecord[] {
    const exists = records.some(
      (record) => record.itemId === next.itemId && record.warehouseId === next.warehouseId,
    )
    if (!exists) return [...records, next]

    return records.map((record) =>
      record.itemId === next.itemId && record.warehouseId === next.warehouseId ? next : record,
    )
  },

  /**
   * 변경량을 누적 반영한다 (입고·조정).
   * 재고는 음수가 될 수 없으므로 0 에서 바닥을 잡는다.
   */
  applyDeltas(
    records: readonly InventoryRecord[],
    deltas: readonly InventoryDelta[],
    updatedAt: string,
  ): InventoryRecord[] {
    return deltas.reduce<InventoryRecord[]>(
      (acc, delta) => {
        const current = inventoryRepository.find(acc, delta.itemId, delta.warehouseId)
        const base: InventoryRecord = current ?? {
          itemId: delta.itemId,
          warehouseId: delta.warehouseId,
          onHand: 0,
          reserved: 0,
          updatedAt,
        }

        return inventoryRepository.upsert(acc, {
          ...base,
          onHand: Math.max(0, base.onHand + (delta.onHand ?? 0)),
          reserved: Math.max(0, base.reserved + (delta.reserved ?? 0)),
          updatedAt,
        })
      },
      [...records],
    )
  },
}

/** 마스터 데이터 조회 — 화면에서 코드/이름을 붙일 때 쓴다 */
export const masterRepository = {
  itemMap(items: readonly Item[]): Map<string, Item> {
    return new Map(items.map((item) => [item.id, item]))
  },

  warehouseMap(warehouses: readonly Warehouse[]): Map<string, Warehouse> {
    return new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]))
  },

  defaultWarehouseId(warehouses: readonly Warehouse[]): string {
    return warehouses.find((warehouse) => warehouse.isDefault)?.id ?? warehouses[0]?.id ?? ''
  },
}
