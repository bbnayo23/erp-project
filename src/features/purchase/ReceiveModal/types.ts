import type { IncomingRow } from '@/features/purchase/types'

/** 담당자가 입고 모달에서 확정하는 값 */
export interface ReceiptDraft {
  quantity: number
  /** 시리얼 관리 품목일 때 개체에 붙일 번호. 비관리 품목은 빈 배열이다. */
  serialNumbers: string[]
  /** 생산의뢰일 때만 채운다 — 검사 없이 입고할 수 없다 */
  inspection?: {
    passedQuantity: number
    failedQuantity: number
    note: string
  }
}

export interface ReceiveModalProps {
  /** 열려 있는 문서. 닫혀 있으면 null */
  row: IncomingRow | null
  /** 자동 채번한 시리얼번호 — 담당자가 고칠 수 있다 */
  suggestedSerials: string[]
  /** 시리얼 관리 품목인가 */
  serialManaged: boolean
  onClose: () => void
  onSubmit: (draft: ReceiptDraft) => void
}
