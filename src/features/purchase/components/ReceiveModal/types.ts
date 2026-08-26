import type { PurchaseOrder, ReceiptLine } from '@/features/purchase/types'

export interface ReceiveModalProps {
  /** null 이면 모달이 닫힌 상태 */
  purchaseOrder: PurchaseOrder | null
  onClose: () => void
  onSubmit: (receipts: ReceiptLine[]) => void
}

export interface ReceiveDialogProps {
  purchaseOrder: PurchaseOrder
  onClose: () => void
  onSubmit: (receipts: ReceiptLine[]) => void
}

/** 입력 행 — 발주 라인에 품목 정보와 잔량을 붙인 것 */
export interface ReceiveLineRow {
  lineId: string
  itemName: string
  itemCode: string
  unit: string
  remaining: number
}
