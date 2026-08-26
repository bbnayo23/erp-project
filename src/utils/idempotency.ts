/**
 * 멱등성 유틸.
 *
 * 재고를 움직이는 액션(수주 확정·출하·입고)은 같은 요청이 두 번 실행되면
 * 재고가 두 번 깎인다. 액션마다 키를 만들고, 이미 처리한 키는 건너뛴다.
 */

/** 액션 이름 + 대상 식별자들로 안정적인 키를 만든다 */
export function createIdempotencyKey(action: string, ...parts: (string | number)[]): string {
  return [action, ...parts].join(':')
}

export interface IdempotencyLog {
  /** 처리 완료된 키 (최신이 뒤) */
  readonly keys: readonly string[]
}

export const emptyIdempotencyLog: IdempotencyLog = { keys: [] }

export function hasProcessed(log: IdempotencyLog, key: string): boolean {
  return log.keys.includes(key)
}

/** 로그가 무한히 자라지 않도록 최근 N 건만 남긴다 */
const MAX_LOG_SIZE = 200

export function markProcessed(log: IdempotencyLog, key: string): IdempotencyLog {
  if (hasProcessed(log, key)) return log
  const next = [...log.keys, key]
  return { keys: next.length > MAX_LOG_SIZE ? next.slice(next.length - MAX_LOG_SIZE) : next }
}

/**
 * 키가 처음 들어온 경우에만 mutate 를 실행한다.
 * 중복 요청이면 상태를 그대로 반환하므로 호출부는 결과만 쓰면 된다.
 */
export function runOnce<S extends { idempotency: IdempotencyLog }>(
  state: S,
  key: string,
  mutate: (state: S) => S,
): S {
  if (hasProcessed(state.idempotency, key)) return state
  const next = mutate(state)
  return { ...next, idempotency: markProcessed(next.idempotency, key) }
}
