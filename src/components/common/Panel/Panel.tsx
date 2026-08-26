import { FilterBar, Root } from './styled'
import type { PanelProps } from './types'

/**
 * 표를 감싸는 카드. 필터 바와 표를 같은 테두리 안에 묶는다.
 * 필터를 슬롯으로 받는 이유: 화면마다 FilterBar 를 따로 조립하면 여백이 갈린다.
 */
export function Panel({ filter, children, className }: PanelProps) {
  return (
    <Root className={className}>
      {filter && <FilterBar>{filter}</FilterBar>}
      {children}
    </Root>
  )
}
