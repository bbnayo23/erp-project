import type { ReactNode } from 'react'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  /** 기본 너비는 theme.layout.drawerWidth */
  width?: string
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
}
