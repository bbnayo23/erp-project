import type { ReactNode } from 'react'

export interface OverlayProps {
  /** 패널을 화면 중앙(모달)에 둘지 우측 끝(드로어)에 붙일지 */
  align?: 'center' | 'end'
  /** 딤 클릭으로 닫을 때 호출. 넘기지 않으면 딤 클릭이 무시된다. */
  onDismiss?: () => void
  children?: ReactNode
}

export interface UseOverlayOptions {
  open: boolean
  onClose: () => void
  closeOnEsc?: boolean
}
