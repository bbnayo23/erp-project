import type {
  ISODateString,
  IncomingDocumentType,
  IncomingProgressStatus,
  InspectionStatus,
  OrderId,
  Quantity,
} from '@/types'
import type { StatusDescriptor } from '@/components/common/StatusBadge'

/**
 * 입고예정 문서 하나를 두고 담당자가 지금 무엇을 해야 하는가.
 *
 * 07_입고예정의 진행상태 7가지를 그대로 쓰지 않는다. 진행상태는 문서가 어디까지
 * 왔는지를 말할 뿐 다음 행동을 말하지 않는다 — '생산 완료' 와 '검사 완료' 는 서로
 * 다른 진행상태지만 눌러야 하는 버튼은 각각 검사와 입고로 갈린다.
 *
 * 준비상태(PreparationStatus)와 같은 축이 아니다. 저쪽은 주문이 나갈 수 있는가를,
 * 이쪽은 문서가 창고에 들어올 수 있는가를 본다.
 */
export type PurchaseStage =
  /** 확정되지 않은 '작성 중' — 아직 공급처에 나가지 않아 입고예정으로 세지 않는다 */
  | 'DRAFT'
  /** 검사 전·검사 대기 — 통과시켜야 현재고가 될 수 있다 */
  | 'INSPECT'
  /** 도착일이 지났고 잔여가 남았다 — 지금 입고를 눌러야 하는 문서 */
  | 'ARRIVED'
  /** 아직 도착하지 않았다 — 기다리면 되는 문서 */
  | 'SCHEDULED'
  /** 계획수량을 모두 입고했다 */
  | 'DONE'

export type PurchaseStageFilter = PurchaseStage | 'ALL'

/**
 * 입고 처리 이력 한 줄.
 *
 * 발주 화면에서 담당자가 입고를 누른 뒤 확인해야 하는 것은 둘이다 — 현재고가 정말
 * 늘었는가, 그 물건을 기다리던 주문이 풀렸는가. 문서 목록은 첫 번째만 답하므로
 * 주문의 지금 준비상태를 함께 붙인다.
 */
export interface ReceiptHistoryRow {
  movementId: string
  documentId?: string
  itemCode: string
  itemName: string
  warehouseName: string
  /** 이 입고로 늘어난 수량 */
  receivedQuantity: Quantity
  /** 입고 뒤 현재고 */
  currentQuantity: Quantity
  /** 이 문서가 풀어주려던 주문 */
  orderId?: string
  /** 그 주문의 지금 준비상태 — 입고로 무엇이 바뀌었는지 */
  orderStatusDescriptor?: StatusDescriptor
  occurredLabel: string
}
export type DocumentTypeFilter = IncomingDocumentType | 'ALL'

/**
 * 발주 현황 한 줄. 표에 그릴 값만 담는다 — 화면에서 계산하지 않기 위해서다.
 *
 * 주문 상세의 IncomingDocumentRow 와 다른 타입인 이유는 기준이 다르기 때문이다.
 * 저쪽은 특정 주문의 배송일을 맞출 수 있는지(`usable`)를 묻고, 이쪽은 주문과 무관하게
 * 문서 자체가 어디까지 왔는지를 묻는다. 한 타입에 둘 다 담으면 주문 없이 볼 때
 * 의미가 없는 필드가 남는다.
 */
export interface IncomingRow {
  documentId: string
  documentType: IncomingDocumentType
  /** 구매발주 / 생산의뢰 */
  typeLabel: string

  itemCode: string
  itemName: string

  warehouseCode: string
  warehouseName: string

  supplierName: string

  plannedQuantity: Quantity
  receivedQuantity: Quantity
  remainingQuantity: Quantity

  availableDate: ISODateString
  /** 2026.07.22 */
  availableLabel: string
  /** 기준시각 대비 — '2일 뒤 도착' / '오늘 도착' / '3일 지연' / '입고 완료' */
  arrivalLabel: string
  /** 도착일이 지났는데 잔여가 남아 있다 — 강조가 필요하다 */
  overdue: boolean

  progressStatus: IncomingProgressStatus
  inspectionStatus: InspectionStatus
  /** 07_입고예정 확정여부 — 미확정 문서는 입고예정으로 세지 않는다 */
  confirmed: boolean

  stage: PurchaseStage
  stageDescriptor: StatusDescriptor
  /** 단계를 설명하는 한 줄 — 다음에 무엇을 해야 하는지 */
  detail: string

  /** 검사 대기 상태라 통과시킬 수 있다 */
  canInspect: boolean
  /** 확정 · 검사 완료 · 잔여 있음 */
  canReceive: boolean

  /** 이 문서를 만들게 한 주문 — 부족분이 어디서 왔는지 되짚는 길 */
  relatedOrderId?: OrderId
}

export interface PurchaseFilter {
  stage: PurchaseStageFilter
  documentType: DocumentTypeFilter
  /** 입고창고 코드. 'ALL' 이면 전체 */
  warehouseCode: string
  /** 문서번호 · 품목코드 · 품목명 부분 일치 */
  keyword: string
}
