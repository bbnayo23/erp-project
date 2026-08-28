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

  ALREADY_CONFIRMED: '이미 확정된 문서입니다.',
  QUANTITY_MISMATCH: '합격 + 불합격 수량이 남은 수량과 맞지 않습니다.',
}

/** 발주하지 못한 부족분의 사유 — issueIncomingDocuments 가 문구까지 만들어 주지만, 요약 문장에 쓴다 */
export const ISSUE_REJECTION: Record<IssueRejectionCode, string> = {
  UNKNOWN_ITEM: '미등록 품목',
  NOT_ORDERABLE: '발주 대상 아님',
  MISSING_SUPPLIER: '기본공급처 없음',
  UNKNOWN_WAREHOUSE: '미등록 창고',
  INACTIVE_WAREHOUSE: '사용 중지 창고',
}

/**
 * 성공 안내는 두 층으로 나눈다.
 *
 * 제목은 '저장되었습니다 · 완료되었습니다' 로 끝난다 — 담당자가 토스트에서 확인해야
 * 하는 것은 처리가 됐다는 사실 하나이고, 그건 0.5초 안에 읽혀야 한다.
 * 설명은 그 처리가 재고의 어느 칸을 움직였는지 말한다. 두 문장을 한 줄로 붙이면
 * 사실이 설명에 묻힌다.
 */
export interface ActionSuccessMessage {
  title: string
  description: string
}

export const ACTION_SUCCESS: Record<
  'RESERVE' | 'RELEASE' | 'SHIP' | 'ISSUE' | 'RECEIVE' | 'INSPECT' | 'CONFIRM',
  ActionSuccessMessage
> = {
  RESERVE: {
    title: '예약이 완료되었습니다',
    description: '개체까지 배정되어 출고할 수 있습니다.',
  },
  RELEASE: {
    title: '예약 해제가 완료되었습니다',
    description: '재고가 다른 주문에 돌아갑니다.',
  },
  SHIP: {
    title: '출고가 완료되었습니다',
    description: '현재고와 예약수량이 함께 줄었습니다.',
  },
  ISSUE: {
    title: '발주가 저장되었습니다',
    description: '문서를 만든 것만으로 현재고는 늘지 않습니다. 입고해야 늘어납니다.',
  },
  RECEIVE: {
    title: '입고가 완료되었습니다',
    description: '현재고가 늘어 대기 중인 주문이 다시 판정됩니다.',
  },
  CONFIRM: {
    title: '발주가 확정되었습니다',
    description: '이제 입고예정으로 세어 대기 중인 주문이 다시 판정됩니다.',
  },
  INSPECT: {
    title: '검사 결과가 저장되었습니다',
    description: '이제 입고할 수 있습니다.',
  },
}

/** 실패 토스트의 제목. 무엇이 막혔는지는 설명(ACTION_FAILURE)이 말한다. */
export const ACTION_FAILURE_TITLE = '처리하지 못했습니다'

/**
 * 반복 요청의 제목.
 *
 * 실패로 띄우지 않는다. 요청한 상태가 이미 이루어져 있다는 뜻이라, 빨갛게 띄우면
 * 담당자가 무언가 잘못한 줄 알고 되돌리려 한다.
 */
export const ACTION_DUPLICATE_TITLE = '이미 처리된 요청입니다'
