import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * point 는 '지금 이걸 하라' 하나에만 쓴다.
 *
 * 어두운 면 위의 주 액션 자리다 — 남색 primary 는 어두운 배경에서 대비가 사라진다.
 * 화면당 한 번을 넘기면 강조가 아니라 무늬가 된다.
 */
export type ButtonVariant = 'primary' | 'point' | 'secondary' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'fullWidth'> {
  /** 아이콘만 있는 버튼은 접근 가능한 이름이 반드시 필요하다 */
  'aria-label': string
}
