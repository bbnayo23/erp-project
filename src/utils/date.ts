/** 앱 전체에서 날짜는 'YYYY-MM-DD' 문자열로만 다룬다 — 타임존 착오를 원천 차단한다. */
export type IsoDate = string

const pad = (value: number) => String(value).padStart(2, '0')

export function toIsoDate(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function today(): IsoDate {
  return toIsoDate(new Date())
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const [year, month, day] = date.split('-').map(Number)
  // UTC 로 계산해야 DST 경계에서 하루가 밀리지 않는다
  const base = Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)
  const shifted = new Date(base + days * 86_400_000)
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`
}

export function diffDays(from: IsoDate, to: IsoDate): number {
  const parse = (value: IsoDate) => {
    const [year, month, day] = value.split('-').map(Number)
    return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)
  }
  return Math.round((parse(to) - parse(from)) / 86_400_000)
}

/** 기준일(기본 오늘)보다 이전이면 납기 초과 */
export function isOverdue(dueDate: IsoDate, baseDate: IsoDate = today()): boolean {
  return diffDays(baseDate, dueDate) < 0
}

/** 2026-08-26 → 2026.08.26 */
export function formatDate(date: IsoDate | undefined | null): string {
  if (!date) return '-'
  return date.slice(0, 10).replace(/-/g, '.')
}

/** 납기까지 남은 일수를 사람이 읽는 문장으로 */
export function formatDueLabel(dueDate: IsoDate, baseDate: IsoDate = today()): string {
  const days = diffDays(baseDate, dueDate)
  if (days === 0) return '오늘'
  if (days > 0) return `${days}일 남음`
  return `${Math.abs(days)}일 초과`
}
