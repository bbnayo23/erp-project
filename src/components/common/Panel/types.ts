import type { ReactNode } from 'react'

export interface PanelProps {
  /** 상단 필터 바에 들어갈 컨트롤들. 없으면 필터 바 자체가 렌더되지 않는다. */
  filter?: ReactNode
  children?: ReactNode
  className?: string
}
