import { Badge } from '@/components/common/Badge'
import type { StatusBadgeProps } from './types'

/**
 * 상태 표시 전용 배지.
 * Badge 를 직접 쓰면 화면마다 톤이 갈리므로, 상태는 반드시 이 컴포넌트를 거친다.
 */
export function StatusBadge({ descriptor, size = 'md' }: StatusBadgeProps) {
  return (
    <Badge tone={descriptor.tone} variant="subtle" size={size} dot>
      {descriptor.label}
    </Badge>
  )
}
