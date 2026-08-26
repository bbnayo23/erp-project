import type { ISODateString, ProcessedRequest, RequestKind } from '@/types'

/**
 * 요청 단위 멱등성.
 *
 * 재고를 바꾸는 동작은 같은 요청이 반복되어도 결과가 한 번만 반영되어야 한다 (00_안내).
 * 각 동작이 자기만의 근거로 중복을 막으면 빈틈이 생긴다 — 예약은 Reservation 기록으로
 * 막히지만, 입고는 같은 문서에 3개를 두 번 넣어도 둘 다 정당한 부분 입고로 보인다.
 * 그래서 요청 ID 를 판정 근거로 따로 둔다.
 *
 * 요청 ID 는 호출부가 만들어 넘긴다. 도메인 함수 안에서 생성하면 매 호출이 새 요청이
 * 되어 멱등성이 성립하지 않는다.
 */

export interface RequestContext {
  processedRequests: readonly ProcessedRequest[]
}

export const isProcessed = (
  processedRequests: readonly ProcessedRequest[],
  requestId: string,
): boolean => processedRequests.some((request) => request.requestId === requestId)

export const markProcessed = (
  processedRequests: readonly ProcessedRequest[],
  requestId: string,
  kind: RequestKind,
  processedAt: ISODateString,
): ProcessedRequest[] => [...processedRequests, { requestId, kind, processedAt }]

/**
 * 반복 요청으로 되돌려주는 실패 코드.
 *
 * 실패지만 오류는 아니다 — 요청한 상태가 이미 이루어져 있다는 뜻이다. 화면은 이 코드를
 * 에러로 띄우지 말고 조용히 넘겨야 한다. 재고를 두 번 깎지 않았다는 것이 성공 조건이다.
 */
export const DUPLICATE_REQUEST = 'DUPLICATE_REQUEST' as const
export type DuplicateRequest = typeof DUPLICATE_REQUEST
