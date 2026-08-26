import type { IsoDate } from '@/utils/date'

/**
 * 발주 도메인 타입.
 *
 * 상태 흐름
 *   DRAFT ──발주──▶ ORDERED ──부분입고──▶ PARTIALLY_RECEIVED ──잔량입고──▶ RECEIVED
 *     └────────────────────취소────────────────────▶ CANCELLED
 */

export type PurchaseOrderStatus =
  'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'

export interface PurchaseOrderLine {
  id: string
  itemId: string
  /** 발주 수량 */
  quantity: number
  /** 누적 입고 수량 (<= quantity) */
  receivedQuantity: number
  unitPrice: number
}

export interface PurchaseOrder {
  id: string
  code: string
  supplier: string
  orderedAt: IsoDate
  /** 리드타임으로 계산한 입고 예정일 */
  expectedDate: IsoDate
  /** 입고될 창고 */
  warehouseId: string
  status: PurchaseOrderStatus
  lines: PurchaseOrderLine[]
}

/** 소요량 대비 부족분 한 줄 — 발주 제안의 근거가 된다 */
export interface ShortageLine {
  itemId: string
  warehouseId: string
  /** 미결 수주가 요구하는 수량 */
  required: number
  /** onHand - reserved */
  available: number
  /** 발주 완료·미입고 수량 */
  incoming: number
  safetyStock: number
  /** max(0, required + safetyStock - available - incoming) */
  shortage: number
}

/** 입고 처리 입력 — 라인별로 이번에 받은 수량 */
export interface ReceiptLine {
  lineId: string
  quantity: number
}

/** 화면에 뿌리는 부족분 한 줄 */
export interface ShortageRow extends ShortageLine {
  itemCode: string
  itemName: string
  unit: string
  supplier: string
  unitPrice: number
  leadTimeDays: number
  warehouseName: string
  /** shortage × unitPrice */
  estimatedAmount: number
}

/** 화면에 뿌리는 발주 한 줄 */
export interface PurchaseOrderRow {
  purchaseOrder: PurchaseOrder
  warehouseName: string
  totalQuantity: number
  receivedQuantity: number
  totalAmount: number
  /** 0 ~ 1 */
  progress: number
  /** 입고 예정일이 지났는데 미입고 */
  delayed: boolean
}

export interface PurchasePlan {
  rows: ShortageRow[]
  /** 발주 시 만들어질 건수 = 공급처 수 */
  supplierCount: number
  totalAmount: number
}

export interface PurchaseOrderSummary {
  /** 잔량이 남은 발주 건수 */
  open: number
  delayed: number
  /** 입고 예정 잔량 합계 */
  incomingQuantity: number
}

export interface UsePurchaseOrderRowsResult {
  rows: PurchaseOrderRow[]
  summary: PurchaseOrderSummary
}
