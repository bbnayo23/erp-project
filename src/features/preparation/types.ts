import type { ISODateString, OrderId, PreparationStatus, Quantity } from '@/types'
import type { StatusDescriptor } from '@/components/common/StatusBadge'

/** 배송 준비 현황 한 줄. 표에 그릴 값만 담는다 — 화면에서 계산하지 않기 위해서다. */
export interface PreparationRow {
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
  /** 주문번호 부분 일치 */
  keyword: string
  /**
   * 예약 여부. 준비상태와 다른 축이라 따로 둔다 — 예약 완료 주문은 준비상태가 READY 지만
   * 다음 행동이 예약이 아니라 출고다. 'ALL' 이면 구분하지 않는다.
   */
  reserved: 'ALL' | 'RESERVED' | 'UNRESERVED'
}
