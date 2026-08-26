import type { BadgeSize, BadgeTone } from '@/components/common/Badge'

/** 상태 코드 → 라벨/톤 매핑. 각 피처의 utils.ts 가 이 형태로 정의를 넘긴다. */
export interface StatusDescriptor {
  label: string
  tone: BadgeTone
}

export interface StatusBadgeProps {
  descriptor: StatusDescriptor
  size?: BadgeSize
}
