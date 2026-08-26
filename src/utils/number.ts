const decimal = new Intl.NumberFormat('ko-KR')

export const formatNumber = (value: number) => decimal.format(value)

/** 수량 + 단위 (예: 3 EA). 이 데이터에는 금액이 없어 통화 포맷은 두지 않는다. */
export const formatQuantity = (value: number, unit = 'EA') => `${decimal.format(value)} ${unit}`

export const sumBy = <T>(items: readonly T[], pick: (item: T) => number) =>
  items.reduce((acc, item) => acc + pick(item), 0)

/** 0 나눗셈을 0 으로 흘려보낸다 — 진행률에서 NaN 이 UI 로 새는 것을 막는다 */
export const ratio = (numerator: number, denominator: number) =>
  denominator === 0 ? 0 : numerator / denominator
