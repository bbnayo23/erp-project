import type { ReactNode } from 'react'

export type SummaryTone = 'default' | 'point' | 'warning' | 'danger'

export interface SummaryCardItem {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: SummaryTone
  /**
   * 누르면 이 지표로 표를 걸러낸다.
   *
   * 없으면 카드는 읽기 전용이다. 담당자가 '재고 부족 8건' 을 보고 그 8건을 보려면
   * 아래 필터를 다시 찾아 골라야 하는데, 방금 본 숫자를 누르는 게 자연스럽다.
   */
  onSelect?: () => void
  /** onSelect 가 있을 때, 지금 이 지표로 걸러진 상태인가 */
  selected?: boolean
}

export interface SummaryCardsProps {
  items: SummaryCardItem[]
  /**
   * 묶음의 이름. 화면에는 보이지 않고 스크린리더에만 읽힌다.
   * 지표 라벨이 표의 값과 같은 문자열일 수 있어(예: '입고 대기') 이 영역을 가리킬
   * 이름이 필요하다.
   */
  label?: string
  className?: string
}
