const currency = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
})

const number = new Intl.NumberFormat('ko-KR')

const percent = new Intl.NumberFormat('ko-KR', {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
})

export const formatCurrency = (value: number) => currency.format(value)

export const formatNumber = (value: number) => number.format(value)

/** 0.124 가 아니라 12.4 처럼 이미 퍼센트 단위인 값을 넣는다 */
export const formatPercent = (value: number) => percent.format(value / 100)

export const formatDate = (value: string) => {
  if (!value) return '-'
  return value.slice(0, 10).replace(/-/g, '.')
}

/** 128,400,000 → 1.28억 (대시보드 카드용) */
export function formatCompactWon(value: number): string {
  if (Math.abs(value) >= 100_000_000) return `${(value / 100_000_000).toFixed(2)}억`
  if (Math.abs(value) >= 10_000) return `${(value / 10_000).toFixed(0)}만`
  return number.format(value)
}
