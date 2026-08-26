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
  className?: string
}
