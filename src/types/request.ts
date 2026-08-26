import type { ISODateString } from './common'

/**
 * 처리 이력 — 같은 요청이 두 번 반영되는 것을 막는 근거다.
 *
 * 재고를 바꾸는 동작(예약·출고·입고)은 반복 요청에도 결과가 한 번만 반영되어야 한다.
 * 버튼 두 번 클릭, 응답 유실 후 재시도, 새로고침 후 재실행이 모두 같은 사건이다.
 *
 * 판정 근거를 동작마다 따로 찾으면 빈틈이 생긴다. 예약은 Reservation 기록으로
 * 막을 수 있지만 입고는 그런 자연 키가 없다 — 같은 문서에 3개를 두 번 넣으면
 * 둘 다 정당한 부분 입고로 보인다. 그래서 요청 단위 키를 따로 둔다.
 */
export interface ProcessedRequest {
  /** 호출부가 만들어 넘기는 요청 ID (REQ-001, SHIP-001 …) */
  requestId: string
  kind: RequestKind
  processedAt: ISODateString
}

export type RequestKind = 'RESERVE' | 'RELEASE' | 'SHIP' | 'RECEIVE' | 'INSPECT' | 'ISSUE_INCOMING'
