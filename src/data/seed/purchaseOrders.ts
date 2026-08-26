import type { PurchaseOrder } from '@/features/purchase/types'

/**
 * 시드 발주.
 *
 * ORDERED / PARTIALLY_RECEIVED 건의 잔량은 입고예정(incoming)으로 계산돼
 * 부족분 산출에서 차감된다. RECEIVED 건은 이미 onHand 에 반영된 것으로 본다.
 */
export const SEED_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-2601',
    code: 'PO-2026-0601',
    supplier: '대성전자',
    orderedAt: '2026-08-10',
    expectedDate: '2026-08-22',
    warehouseId: 'WH-1',
    status: 'ORDERED',
    lines: [
      { id: 'PO-2601-L1', itemId: 'IT-MB', quantity: 20, receivedQuantity: 0, unitPrice: 145_000 },
      { id: 'PO-2601-L2', itemId: 'IT-PSU', quantity: 10, receivedQuantity: 0, unitPrice: 72_000 },
    ],
  },
  {
    id: 'PO-2602',
    code: 'PO-2026-0602',
    supplier: '한성테크',
    orderedAt: '2026-08-19',
    expectedDate: '2026-08-29',
    warehouseId: 'WH-1',
    status: 'PARTIALLY_RECEIVED',
    lines: [
      { id: 'PO-2602-L1', itemId: 'IT-RAM', quantity: 40, receivedQuantity: 15, unitPrice: 65_000 },
      { id: 'PO-2602-L2', itemId: 'IT-SSD', quantity: 30, receivedQuantity: 30, unitPrice: 98_000 },
    ],
  },
  {
    id: 'PO-2603',
    code: 'PO-2026-0603',
    supplier: '대성전자',
    orderedAt: '2026-08-02',
    expectedDate: '2026-08-08',
    warehouseId: 'WH-1',
    status: 'RECEIVED',
    lines: [
      {
        id: 'PO-2603-L1',
        itemId: 'IT-CASE',
        quantity: 20,
        receivedQuantity: 20,
        unitPrice: 45_000,
      },
    ],
  },
]
