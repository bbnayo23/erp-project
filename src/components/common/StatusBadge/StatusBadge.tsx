import { Badge } from '@/components/common/Badge'
import type { StatusBadgeProps } from './types'

/**
 * 상태 표시 전용 배지.
 *
 * Badge 를 직접 쓰면 화면마다 톤이 갈리므로, 상태는 반드시 이 컴포넌트를 거친다.
 *
 * `strong` 을 쓰는 이유: 상태는 이 앱에서 가장 자주 읽히는 값이다. 연한 배경만으로는
 * 표를 훑을 때 어느 행이 어떤 상태인지 잡히지 않아, 담당자가 결국 옆의 설명 문구를
 * 한 줄씩 읽게 된다. 톤 테두리와 굵은 글자를 더해 배지 하나로 판단이 끝나게 한다.
 */
export function StatusBadge({ descriptor, size = 'md' }: StatusBadgeProps) {
  return (
    <Badge tone={descriptor.tone} variant="strong" size={size} dot>
      {descriptor.label}
    </Badge>
  )
}
