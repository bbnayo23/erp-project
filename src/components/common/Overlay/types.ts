import type { ReactNode } from 'react'

/** 쌓임 순서. 드로어 위에 모달이 열릴 수 있어 층을 나눠 둔다. */
export type OverlayLayer = 'drawer' | 'modal'

export interface OverlayProps {
  /** 패널을 화면 중앙(모달)에 둘지 우측 끝(드로어)에 붙일지 */
  align?: 'center' | 'end'
  /** 기본은 modal. 드로어는 'drawer' 를 넘겨 모달보다 아래에 둔다. */
  layer?: OverlayLayer
  /** 딤 클릭으로 닫을 때 호출. 넘기지 않으면 딤 클릭이 무시된다. */
  onDismiss?: () => void
  children?: ReactNode
}

export interface UseOverlayOptions {
  open: boolean
  onClose: () => void
  closeOnEsc?: boolean
}
