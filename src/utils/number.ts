const decimal = new Intl.NumberFormat('ko-KR')

const currency = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
})

export const formatNumber = (value: number) => decimal.format(value)

export const formatCurrency = (value: number) => currency.format(value)

/** 수량 + 단위 (예: 1,200 EA) */
export const formatQuantity = (value: number, unit: string) =>
  `${decimal.format(value)}${unit ? ` ${unit}` : ''}`

/** 128,400,000 → 1.28억 (요약 카드용) */
export function formatCompactWon(value: number): string {
  if (Math.abs(value) >= 100_000_000) return `${(value / 100_000_000).toFixed(2)}억`
  if (Math.abs(value) >= 10_000) return `${Math.round(value / 10_000)}만`
  return decimal.format(value)
}

export const sumBy = <T>(items: readonly T[], pick: (item: T) => number) =>
  items.reduce((acc, item) => acc + pick(item), 0)

/** 0 나눗셈을 0 으로 흘려보낸다 — 진행률 계산에서 NaN 이 UI 로 새는 것을 막는다 */
export const ratio = (numerator: number, denominator: number) =>
  denominator === 0 ? 0 : numerator / denominator
