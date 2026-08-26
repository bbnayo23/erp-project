import type { ReactNode } from 'react'

export type NoticeTone = 'success' | 'danger'

export interface NoticeProps {
  tone: NoticeTone
  children?: ReactNode
  className?: string
}
