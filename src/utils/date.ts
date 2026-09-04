import type { ISODateString } from '@/types'

/**
 * 날짜는 오프셋이 붙은 ISO 문자열로만 다룬다 — '2026-07-21T09:00:00+09:00'.
 *
 * 날짜 계산은 문자열의 날짜 부분만 UTC 로 옮긴 뒤 시각·오프셋을 그대로 되붙인다.
 * Date 객체로 왕복시키면 실행 환경의 로컬 타임존이 끼어들어 하루가 밀린다.
 */

const pad = (value: number) => String(value).padStart(2, '0')

/** '2026-07-21T09:00:00+09:00' → '2026-07-21' */
export const dateOf = (iso: ISODateString): string => iso.slice(0, 10)

/** 날짜 부분을 뺀 나머지 — 'T09:00:00+09:00' */
const timeOf = (iso: ISODateString): string => iso.slice(10)

const toUtcMillis = (date: string): number => {
  const [year, month, day] = date.split('-').map(Number)
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)
}

const fromUtcMillis = (millis: number): string => {
  const d = new Date(millis)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** 시각과 오프셋은 유지하고 날짜만 옮긴다 */
export const addDays = (iso: ISODateString, days: number): ISODateString => {
  return fromUtcMillis(toUtcMillis(dateOf(iso)) + days * 86_400_000) + timeOf(iso)
}

/** 달력 날짜 기준 일수 차 (시각은 무시) */
export const diffDays = (from: ISODateString, to: ISODateString): number => {
  return Math.round((toUtcMillis(dateOf(to)) - toUtcMillis(dateOf(from))) / 86_400_000)
}

/** 오프셋을 반영한 시각 비교. 정렬 comparator 로 그대로 쓸 수 있다. */
export const compareIso = (a: ISODateString, b: ISODateString): number =>
  Date.parse(a) - Date.parse(b)

export const isBefore = (a: ISODateString, b: ISODateString): boolean => compareIso(a, b) < 0

/** 2026-07-21T09:00:00+09:00 → 2026.07.21 */
export const formatDate = (iso: ISODateString | undefined): string =>
  iso ? dateOf(iso).replace(/-/g, '.') : '-'

/** 2026-07-21T09:00:00+09:00 → 2026.07.21 09:00 */
export const formatDateTime = (iso: ISODateString | undefined): string =>
  iso ? `${formatDate(iso)} ${iso.slice(11, 16)}` : '-'

/** 기준일 대비 납기 문장 */
export const formatDueLabel = (due: ISODateString, baseAt: ISODateString): string => {
  const days = diffDays(baseAt, due)
  if (days === 0) return '오늘'
  if (days > 0) return `${days}일 남음`
  return `${Math.abs(days)}일 초과`
}

/**
 * `<input type="date">` 가 읽는 형식 (YYYY-MM-DD).
 *
 * ISO 문자열 앞 10자를 그대로 쓴다. Date 로 파싱해 다시 만들면 시간대에 따라 하루가
 * 밀린다 — 이 앱의 날짜는 전부 +09:00 이 붙은 로컬 날짜다.
 */
export const toDateInput = (iso: ISODateString): string => iso.slice(0, 10)

/** 날짜 입력값(YYYY-MM-DD)을 이 앱의 ISO 형식으로 되돌린다 */
export const fromDateInput = (value: string): ISODateString => `${value}T00:00:00+09:00`
