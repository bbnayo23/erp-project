import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'primary' | 'point' | 'success' | 'warning' | 'danger' | 'info'

/**
 * subtle  연한 배경 — 보조 정보
 * strong  연한 배경 + 톤 테두리 + 굵은 글자 — 상태처럼 반드시 읽혀야 하는 값
 * solid   꽉 찬 배경 — 한 화면에 하나만
 * outline 테두리만 — 배경이 이미 색을 갖고 있을 때
 */
export type BadgeVariant = 'subtle' | 'strong' | 'solid' | 'outline'
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
