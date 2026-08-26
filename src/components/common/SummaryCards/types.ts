import type { ReactNode } from 'react'

export type SummaryTone = 'default' | 'warning' | 'danger'

export interface SummaryCardItem {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: SummaryTone
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
