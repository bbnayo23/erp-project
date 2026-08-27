import type { ReactNode } from 'react'

export type SummaryTone = 'default' | 'point' | 'warning' | 'danger'

export interface SummaryCardItem {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: SummaryTone

  /**
   * 이 칸을 눌렀을 때 담당자가 하게 되는 일.
   *
   * 비율(38%)을 적던 자리다. '재고 부족이 전체의 31%' 는 아무 행동도 유발하지 않는다 —
   * 대시보드처럼 보이려고 넣은 장식이었다. 이 화면은 "우리가 어떻게 하고 있나" 가
   * 아니라 **"지금 이 숫자가 맞나, 그래서 뭘 하나"** 에 답해야 한다.
   *
   * 그래서 같은 자리에 다음 행동을 적는다. 이 줄이 있으면 지표 카드가 곧 작업 대기열이
   * 된다 — 세는 화면이 아니라 고르는 화면이다.
   */
  action?: string

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
