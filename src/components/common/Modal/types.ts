import type { ReactNode } from 'react'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  /** 하단 액션 영역 */
  footer?: ReactNode
  size?: ModalSize
  /** 딤 클릭으로 닫기 (기본 true) */
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
}
