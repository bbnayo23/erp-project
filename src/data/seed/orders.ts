import type { Order } from '@/features/orders/types'

/**
 * 시드 수주.
 *
 * CONFIRMED 로 둔 건들은 스토어 부팅 시 재고 예약이 적용되고, 결과에 따라
 * ALLOCATED / PARTIALLY_ALLOCATED 로 내려앉는다. 시드에 예약 결과를 미리
 * 적어두지 않는 이유는 재고 수량과 어긋나지 않게 하기 위함이다.
 */
export const SEED_ORDERS: Order[] = [
  {
    id: 'SO-2601',
    code: 'SO-2026-0601',
    customerName: '한빛물산',
    orderedAt: '2026-08-24',
    dueDate: '2026-09-10',
    warehouseId: 'WH-1',
    status: 'DRAFT',
    lines: [{ id: 'SO-2601-1', itemId: 'BDL-3', quantity: 5, unitPrice: 950_000 }],
    memo: '오피스 풀세트 — 신규 지점 개설분',
  },
  {
    id: 'SO-2602',
    code: 'SO-2026-0602',
    customerName: '대명오피스',
    orderedAt: '2026-08-18',
    dueDate: '2026-08-31',
    warehouseId: 'WH-1',
    status: 'CONFIRMED',
    lines: [{ id: 'SO-2602-1', itemId: 'BDL-1', quantity: 8, unitPrice: 690_000 }],
  },
  {
    id: 'SO-2603',
    code: 'SO-2026-0603',
    customerName: '서울시청 구매과',
    orderedAt: '2026-08-12',
    dueDate: '2026-08-20',
    warehouseId: 'WH-1',
    status: 'CONFIRMED',
    lines: [
      { id: 'SO-2603-1', itemId: 'BDL-2', quantity: 12, unitPrice: 275_000 },
      { id: 'SO-2603-2', itemId: 'IT-MON', quantity: 4, unitPrice: 219_000 },
    ],
    memo: '납기 초과 — 모니터 입고 즉시 출고',
  },
  {
    id: 'SO-2604',
    code: 'SO-2026-0604',
    customerName: '미래산업',
    orderedAt: '2026-08-25',
    dueDate: '2026-09-15',
    warehouseId: 'WH-1',
    status: 'DRAFT',
    lines: [
      { id: 'SO-2604-1', itemId: 'IT-SSD', quantity: 40, unitPrice: 98_000 },
      { id: 'SO-2604-2', itemId: 'IT-RAM', quantity: 30, unitPrice: 65_000 },
    ],
  },
  {
    id: 'SO-2605',
    code: 'SO-2026-0605',
    customerName: '정우테크',
    orderedAt: '2026-08-05',
    dueDate: '2026-08-14',
    warehouseId: 'WH-1',
    status: 'SHIPPED',
    lines: [{ id: 'SO-2605-1', itemId: 'BDL-1', quantity: 3, unitPrice: 690_000 }],
  },
  {
    id: 'SO-2606',
    code: 'SO-2026-0606',
    customerName: '케이피에스',
    orderedAt: '2026-08-21',
    dueDate: '2026-09-04',
    warehouseId: 'WH-2',
    status: 'CONFIRMED',
    lines: [{ id: 'SO-2606-1', itemId: 'BDL-2', quantity: 4, unitPrice: 275_000 }],
  },
]
