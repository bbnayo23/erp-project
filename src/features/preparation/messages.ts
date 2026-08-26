import type { ActionFailureCode } from '@/store/erpStore'
import type { IssueRejectionCode } from '@/domain/purchase/issueIncomingDocuments'

/**
 * 액션 실패 코드 → 담당자가 읽을 문구.
 *
 * 스토어는 코드만 돌려준다. 문구를 스토어에 두면 같은 판정이 두 곳에 흩어지고,
 * 문구를 고치는 일이 재고 로직을 건드리게 된다.
 *
 * 문구는 무엇이 막혔는지가 아니라 무엇을 해야 하는지를 말한다. '예약할 수 없습니다' 는
 * 담당자에게 아무것도 알려주지 않는다.
 */
export const ACTION_FAILURE: Record<ActionFailureCode, string> = {
  // 반복 요청 — 오류가 아니라 이미 되어 있다는 뜻이다
  DUPLICATE_REQUEST: '이미 처리된 요청입니다. 재고는 한 번만 반영되었습니다.',

  NOT_READY: '준비되지 않은 주문입니다. 부족한 품목이 채워져야 예약할 수 있습니다.',
  ALREADY_RESERVED: '이미 예약된 주문입니다.',
  SERIAL_SHORTAGE:
    '수량은 있지만 배정할 개체가 부족합니다. 재고현황과 개체재고가 어긋난 상태라 확인이 필요합니다.',

  NOT_RESERVED: '예약이 없습니다. 먼저 예약해야 출고할 수 있습니다.',
  ALREADY_SHIPPED: '이미 출고된 주문입니다.',

  NOT_CONFIRMED: '확정되지 않은 문서입니다. 발주를 확정한 뒤 입고할 수 있습니다.',
  INSPECTION_PENDING: '품질검사가 끝나지 않았습니다. 검사를 통과해야 현재고에 반영됩니다.',
  INVALID_QUANTITY: '수량이 0 이하입니다.',
  EXCEEDS_REMAINING: '잔여수량을 넘는 입고입니다. 초과 입고는 발주서를 먼저 수정해야 합니다.',
  MISSING_SERIAL_NUMBERS: '입고 수량만큼의 개체번호를 만들 수 없습니다.',
  DUPLICATE_SERIAL: '이미 존재하는 시리얼번호입니다.',

  ORDER_NOT_FOUND: '주문을 찾을 수 없습니다.',
  DOCUMENT_NOT_FOUND: '입고예정 문서를 찾을 수 없습니다.',
  ITEM_NOT_FOUND: '등록되지 않은 품목입니다.',
  NOTHING_TO_ISSUE: '발주할 부족분이 없습니다.',
  NOT_PENDING_INSPECTION: '검사 대기 상태가 아닙니다.',
}

/** 발주하지 못한 부족분의 사유 — issueIncomingDocuments 가 문구까지 만들어 주지만, 요약 문장에 쓴다 */
export const ISSUE_REJECTION: Record<IssueRejectionCode, string> = {
  UNKNOWN_ITEM: '미등록 품목',
  NOT_ORDERABLE: '발주 대상 아님',
  MISSING_SUPPLIER: '기본공급처 없음',
  UNKNOWN_WAREHOUSE: '미등록 창고',
  INACTIVE_WAREHOUSE: '사용 중지 창고',
}

export const ACTION_SUCCESS = {
  RESERVE: '예약했습니다. 개체까지 배정되어 출고할 수 있습니다.',
  RELEASE: '예약을 해제했습니다. 재고가 다른 주문에 돌아갑니다.',
  SHIP: '출고했습니다. 현재고와 예약수량이 함께 줄었습니다.',
  ISSUE: '발주를 생성했습니다. 문서를 만든 것만으로 현재고는 늘지 않습니다.',
  RECEIVE: '입고했습니다. 현재고가 늘어 대기 중인 주문이 다시 판정됩니다.',
  INSPECT: '검사를 통과시켰습니다. 이제 입고할 수 있습니다.',
} as const
