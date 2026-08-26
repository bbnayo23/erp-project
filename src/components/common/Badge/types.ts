import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
export type BadgeVariant = 'subtle' | 'solid' | 'outline'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  tone?: BadgeTone
  variant?: BadgeVariant
  size?: BadgeSize
  /** 좌측에 상태 점 표시 */
  dot?: boolean
  children?: ReactNode
  className?: string
}
