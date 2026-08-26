import type { ISODateString, PreparationBlock, PreparationStatus } from '@/types'
import type { NoticeTone } from '@/components/common/Notice'
import type { StatusDescriptor } from '@/components/common/StatusBadge'
import type {
  AssignedSerialRow,
  IncomingDocumentRow,
  PreparationItemRow,
} from '@/features/preparation/types'

export interface OrderNotice {
  tone: NoticeTone
  message: string
}

/** 주문 머리 정보 */
export interface OrderSummary {
  orderId: string
  orderStatus: string
  orderedAtLabel: string
  deliveryLabel: string
  dueLabel: string
  overdue: boolean
  warehouseName: string
  warehouseCode: string
}

/**
 * 상태에 따라 노출할 액션 (가이드 §29).
 *
 * 누를 수 없는 버튼을 비활성으로 두지 않고 감춘다. 준비되지 않은 주문에 회색 예약 버튼이
 * 있으면 담당자는 왜 안 되는지를 버튼에서 찾으려 한다 — 이유는 품목 표에 있다.
 */
export interface OrderActions {
  canReserve: boolean
  canRelease: boolean
  canShip: boolean
  canIssue: boolean
  /** 발주 버튼에 적을 문구 — 무엇이 몇 개 나가는지 */
  issueLabel: string
}

export interface OrderDetailPageState {
  /** 없는 주문번호로 들어온 경우 */
  found: boolean
  orderId: string

  summary: OrderSummary
  status: PreparationStatus
  statusDescriptor: StatusDescriptor
  detail: string
  reserved: boolean

  /** 확인 필요 사유 — 자동 처리하지 않는 이유 */
  blocks: PreparationBlock[]
  /** 재고 수요에서 빠진 서비스 품목 — 누락이 아니라 원래 대상이 아님을 보여준다 */
  excludedItemNames: string[]

  itemRows: PreparationItemRow[]
  serialRows: AssignedSerialRow[]
  incomingRows: IncomingDocumentRow[]

  actions: OrderActions
  notice: OrderNotice | null
  dismissNotice: () => void

  reserve: () => void
  release: () => void
  ship: () => void
  issue: () => void

  /** 입고 수량 입력 — 문서별로 들고 있는다 */
  receiptQuantity: (documentId: string) => string
  setReceiptQuantity: (documentId: string, value: string) => void
  receive: (documentId: string) => void
  inspect: (documentId: string) => void

  baseAt: ISODateString
}
