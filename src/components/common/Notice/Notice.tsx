import { Root } from './styled'
import type { NoticeProps } from './types'

/** 액션 결과 안내 — 성공과 실패를 같은 자리에서 보여준다 */
export function Notice({ tone, children, className }: NoticeProps) {
  return (
    <Root className={className} $tone={tone} role="status">
      {children}
    </Root>
  )
}
