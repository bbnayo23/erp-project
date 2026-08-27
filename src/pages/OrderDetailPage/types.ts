import type { ISODateString, PreparationBlock, PreparationStatus } from '@/types'
import type { StatusDescriptor } from '@/components/common/StatusBadge'
import type {
  AssignedSerialRow,
  IncomingDocumentRow,
  OrderStep,
  OrderedItemRow,
  PreparationItemRow,
  PreparationRow,
  UnsavedAlert,
} from '@/features/preparation/types'

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

  /** 06_주문에 적힌 그대로의 품목 — 세트를 풀기 전 */
  /**
   * 왼쪽 레일에 세울 주문들 — 목록에서 보던 그 행이다.
   *
   * 상세로 들어오면 목록이 사라져 '내가 몇 번째 주문을 보고 있는지' 를 잃는다. 같은
   * 배정 순서 그대로 카드로 세워 두고 현재 주문을 표시한다.
   */
  railOrders: PreparationRow[]

  /** 발주 → 입고 → 예약 → 출고 네 칸 중 지금 위치 */
  steps: OrderStep[]
  /** 지금 할 일. 출고 완료·확인 필요면 undefined */
  currentStep?: OrderStep

  orderedRows: OrderedItemRow[]
  itemRows: PreparationItemRow[]
  serialRows: AssignedSerialRow[]
  incomingRows: IncomingDocumentRow[]

  actions: OrderActions
  /**
   * 저장하지 않은 입력이 있는가.
   *
   * 이 화면에서 담당자가 손으로 넣는 값은 입고 수량뿐이다. 기본값(잔여 전량)을 그대로
   * 두면 입력한 것이 아니므로, 바꾼 문서가 하나라도 있을 때만 true 다.
   */
  dirty: boolean

  /** 열려 있는 확인창. 없으면 null */
  alert: UnsavedAlert | null
  /** 목록으로 — 입력 중이면 확인창을 띄우고, 아니면 바로 나간다 */
  requestLeave: () => void
  /** 입력한 값 버리기 */
  requestDiscard: () => void
  confirmAlert: () => void
  cancelAlert: () => void

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
