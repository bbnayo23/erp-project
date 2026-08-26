import type { InventoryRecord } from '@/features/inventory/types'

const UPDATED_AT = '2026-08-25'

/**
 * 시드 재고는 실물 수량(onHand)만 담고 reserved 는 항상 0 이다.
 *
 * 예약 수량을 손으로 적어두면 수주 데이터와 어긋나기 쉽다. 대신 스토어가 부팅할 때
 * 확정 상태로 시드된 수주를 reserveInventory 로 흘려보내 예약을 만든다
 * (data/seed/orders.ts, store/erpStore.ts 참고).
 */
const record = (itemId: string, warehouseId: string, onHand: number): InventoryRecord => ({
  itemId,
  warehouseId,
  onHand,
  reserved: 0,
  updatedAt: UPDATED_AT,
})

export const SEED_INVENTORY: InventoryRecord[] = [
  record('IT-CPU', 'WH-1', 12),
  record('IT-RAM', 'WH-1', 18),
  record('IT-SSD', 'WH-1', 25),
  record('IT-MB', 'WH-1', 6),
  record('IT-PSU', 'WH-1', 14),
  record('IT-CASE', 'WH-1', 20),
  record('IT-MON', 'WH-1', 9),
  record('IT-KB', 'WH-1', 30),
  record('IT-MS', 'WH-1', 26),

  record('IT-CPU', 'WH-2', 4),
  record('IT-RAM', 'WH-2', 8),
  record('IT-SSD', 'WH-2', 6),
  record('IT-MB', 'WH-2', 2),
  record('IT-PSU', 'WH-2', 3),
  record('IT-CASE', 'WH-2', 5),
  record('IT-MON', 'WH-2', 5),
  record('IT-KB', 'WH-2', 10),
  record('IT-MS', 'WH-2', 12),
]
