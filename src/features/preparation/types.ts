import type { ISODateString, OrderId, PreparationStatus, Quantity } from '@/types'
import type { StatusDescriptor } from '@/components/common/StatusBadge'

/** 배송 준비 현황 한 줄. 표에 그릴 값만 담는다 — 화면에서 계산하지 않기 위해서다. */
export interface PreparationRow {
  /**
   * 준비 대상이 아닌 주문 — 취소 · 출고 완료 · 배송 완료.
   *
   * 목록에 섞여 있어도 처리 대상이 아님을 행 자체가 말해야 한다.
   */
  excluded: boolean
  /** 06_주문 주문상태 — 제외 주문이 왜 대상이 아닌지 적는다 */
  orderStatus: string
  orderId: OrderId
  /** 재고를 배정받은 순서 (1부터). 이 목록의 정렬 순서와 같다. */
  priority: number

  deliveryDate: ISODateString
  /** 2026.07.25 */
  deliveryLabel: string
  /** 기준시각 대비 — '4일 남음' / '오늘' / '2일 초과' */
  dueLabel: string
  /** 배송일이 지났다 — 강조가 필요하다 */
  overdue: boolean

  warehouseCode: string
  warehouseName: string

  status: PreparationStatus
  statusDescriptor: StatusDescriptor
  /** 상태를 설명하는 한 줄 — 대기 원인, 부족 품목, 확인 사유 */
  detail: string

  /**
   * 예약을 마쳤다. 준비상태는 READY 지만 다음 행동이 다르다 — 예약이 아니라 출고다.
   * 도메인 상태가 아니라 화면이 구분하는 축이라 배지를 따로 준다.
   */
  reserved: boolean

  /** 세트를 푼 뒤의 준비 품목 수 */
  itemCount: number
  /** 발주가 필요한 수량 합계 */
  shortageQuantity: Quantity
}

/**
 * 주문 상세의 품목 한 줄 (가이드 §29).
 *
 * 필요 · 가용재고 · 입고예정 · 부족 네 숫자를 나란히 둔다. 부족이 왜 그 값인지
 * 담당자가 직접 검산할 수 있어야 한다 — 부족 = 필요 - 가용재고 - 입고예정.
 */
/**
 * 한 주문이 출고까지 가는 길의 한 칸.
 *
 * 준비상태(READY · WAITING · SHORTAGE)는 '지금 어디가 막혔는가' 를 말하지만 '그래서
 * 다음에 무엇을 누르는가' 는 말하지 않는다. 담당자가 상세를 열고 가장 먼저 찾는 것이
 * 그 하나라, 네 칸을 순서대로 세워 지금 위치를 표시한다.
 */
export type OrderStepKey = 'ISSUE' | 'RECEIVE' | 'RESERVE' | 'SHIP'

export type OrderStepState =
  /** 끝났다 */
  | 'DONE'
  /** 지금 할 일 */
  | 'CURRENT'
  /** 앞 칸이 끝나야 열린다 */
  | 'TODO'
  /** 이 주문에는 필요 없다 — 재고로 채워지는 주문의 발주·입고 */
  | 'SKIPPED'
  /** 데이터를 확인해야 해서 길 자체가 막혔다 */
  | 'BLOCKED'

export interface OrderStep {
  key: OrderStepKey
  label: string
  state: OrderStepState
  /** CURRENT 일 때 담당자가 할 일 한 줄 */
  hint?: string
}

/**
 * 저장하지 않은 값을 두고 나가려 할 때 묻는 내용.
 *
 * 문구를 화면 컴포넌트에 두지 않는 이유는 준비상태 문구와 같다 — 무엇을 잃는지 말하는
 * 문장이 마크업 사이에 흩어지면 두 경로(뒤로 가기 · 취소)가 다른 말을 하게 된다.
 */
export type UnsavedAlertKind = 'LEAVE' | 'DISCARD'

export interface UnsavedAlert {
  kind: UnsavedAlertKind
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
}

/**
 * 06_주문에 적힌 그대로의 한 줄.
 *
 * 준비 품목 표는 세트를 풀고 서비스를 걷어낸 뒤의 모습이라, 담당자가 주문서와 대조할
 * 수 없다. 취소된 품목과 설치 서비스가 표에서 사라진 것인지 처음부터 없었던 것인지도
 * 구분되지 않는다. 그래서 원본을 그대로 한 표 더 둔다.
 */
export interface OrderedItemRow {
  sequence: number
  itemCode: string
  itemName: string
  itemType: string
  quantity: number
  /** 06_주문 품목상태 — 정상 · 취소 */
  status: string
  /** 이 줄이 준비 수요로 어떻게 옮겨졌는가 */
  note: string
  /** 준비 수요에서 빠진 줄 — 취소 · 서비스 */
  excluded: boolean
}

export interface PreparationItemRow {
  itemCode: string
  itemName: string
  itemType: string

  requiredQuantity: Quantity
  availableQuantity: Quantity
  incomingQuantity: Quantity
  shortageQuantity: Quantity

  status: PreparationStatus
  statusDescriptor: StatusDescriptor
  /** 대기 원인이거나, 부족하면 어떤 문서로 발주될지 */
  note: string
  /** WAITING 의 근거가 된 문서 */
  incomingDocumentIds: string[]
}

/** 예약으로 이 주문에 묶인 개체 */
export interface AssignedSerialRow {
  serialNumber: string
  itemCode: string
  itemName: string
  location: string
  status: string
}

/** 이 주문이 기다리는 입고예정 문서 */
export interface IncomingDocumentRow {
  documentId: string
  /** 구매발주 / 생산의뢰 */
  typeLabel: string

  itemCode: string
  itemName: string
  supplierName: string

  plannedQuantity: Quantity
  receivedQuantity: Quantity
  remainingQuantity: Quantity

  availableLabel: string
  /** 이 주문의 배송일을 맞출 수 있는 물량인가 — 아니면 대기 근거가 되지 못한다 */
  usable: boolean

  progressStatus: string
  inspectionStatus: string

  /** 검사 대기 상태라 통과시킬 수 있다 */
  canInspect: boolean
  /** 확정 · 검사 완료 · 잔여 있음 */
  canReceive: boolean
}

export type PreparationStatusFilter = PreparationStatus | 'ALL'

export interface PreparationFilter {
  status: PreparationStatusFilter
  /** 창고코드. 'ALL' 이면 전체 */
  warehouseCode: string
  /**
   * 배송예정일 (ISO). 'ALL' 이면 전체.
   *
   * 담당자는 '오늘 나갈 것' 을 먼저 본다. 목록이 배송일 순이라 스크롤로도 찾을 수 있지만,
   * 하루치만 남기고 세는 일은 눈으로 하면 틀린다.
   */
  deliveryDate: string
  /** 주문번호 부분 일치 */
  keyword: string
  /**
   * 예약 여부. 준비상태와 다른 축이라 따로 둔다 — 예약 완료 주문은 준비상태가 READY 지만
   * 다음 행동이 예약이 아니라 출고다. 'ALL' 이면 구분하지 않는다.
   */
  reserved: 'ALL' | 'RESERVED' | 'UNRESERVED'

  /**
   * 준비 대상이 아닌 주문(취소 · 출고 완료 · 배송 완료)까지 보여줄지.
   *
   * 기본은 감춘다 — 새로 준비할 것이 없는 주문이라 매일 보는 목록을 늘리기만 한다.
   * 그러나 '그 주문 어디 갔지' 를 확인할 길은 있어야 한다. 담당자가 찾는 주문이
   * 화면에 아예 없으면 데이터가 잘못됐다고 의심하게 된다.
   */
  includeExcluded: boolean
}
