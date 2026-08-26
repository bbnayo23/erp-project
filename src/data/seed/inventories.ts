/**
 * 04_재고현황 (20행) — 기준시각 스냅샷.
 *
 * 가용재고는 여기 없다. 현재고 - 예약수량으로 계산한다.
 * 부분 입고된 수량은 이미 currentQuantity 에 반영돼 있다.
 */

import type { Inventory } from '@/types'

export const SEED_INVENTORIES: Inventory[] = [
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-HQ',
    itemCode: 'MAT-Z10-Q',
    currentQuantity: 3,
    reservedQuantity: 1,
    existingReservationOrderId: 'ORD-PRE-001',
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-HQ',
    itemCode: 'MAT-Z10-K',
    currentQuantity: 2,
    reservedQuantity: 0,
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-HQ',
    itemCode: 'MAT-V3-Q',
    currentQuantity: 1,
    reservedQuantity: 0,
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-HQ',
    itemCode: 'MAT-E5-SS',
    currentQuantity: 2,
    reservedQuantity: 1,
    existingReservationOrderId: 'ORD-PRE-004',
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-HQ',
    itemCode: 'FRM-DMN-Q',
    currentQuantity: 1,
    reservedQuantity: 0,
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-HQ',
    itemCode: 'FRM-DMN-K',
    currentQuantity: 2,
    reservedQuantity: 0,
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-HQ',
    itemCode: 'FRM-LOW-Q',
    currentQuantity: 0,
    reservedQuantity: 0,
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-HQ',
    itemCode: 'CVR-WP-Q',
    currentQuantity: 6,
    reservedQuantity: 1,
    existingReservationOrderId: 'ORD-PRE-002',
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-HQ',
    itemCode: 'CVR-WP-K',
    currentQuantity: 3,
    reservedQuantity: 0,
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-HQ',
    itemCode: 'TOP-LTX-Q',
    currentQuantity: 4,
    reservedQuantity: 2,
    existingReservationOrderId: 'ORD-PRE-005',
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-08',
    itemCode: 'PIL-ZERO',
    currentQuantity: 10,
    reservedQuantity: 2,
    existingReservationOrderId: 'ORD-PRE-003',
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-08',
    itemCode: 'PIL-CERV',
    currentQuantity: 6,
    reservedQuantity: 0,
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-08',
    itemCode: 'CVR-WP-Q',
    currentQuantity: 3,
    reservedQuantity: 0,
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-08',
    itemCode: 'TOP-LTX-Q',
    currentQuantity: 1,
    reservedQuantity: 0,
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-CJ',
    itemCode: 'MAT-V3-Q',
    currentQuantity: 2,
    reservedQuantity: 0,
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-CJ',
    itemCode: 'FRM-LOW-Q',
    currentQuantity: 3,
    reservedQuantity: 0,
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-CJ',
    itemCode: 'CVR-WP-K',
    currentQuantity: 2,
    reservedQuantity: 0,
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-CJ',
    itemCode: 'PIL-ZERO',
    currentQuantity: 5,
    reservedQuantity: 1,
    existingReservationOrderId: 'ORD-PRE-006',
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-LEGACY',
    itemCode: 'MAT-Z10-Q',
    currentQuantity: 5,
    reservedQuantity: 0,
  },
  {
    baseAt: '2026-07-21T09:00:00+09:00',
    warehouseCode: 'WH-LEGACY',
    itemCode: 'FRM-DMN-Q',
    currentQuantity: 2,
    reservedQuantity: 0,
  },
]
