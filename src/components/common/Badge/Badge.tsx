import { BadgeRoot } from './styled'
import type { BadgeProps } from './types'

export function Badge({
  tone = 'neutral',
  variant = 'subtle',
  size = 'md',
  dot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <BadgeRoot className={className} $tone={tone} $variant={variant} $size={size} $dot={dot}>
      {children}
    </BadgeRoot>
  )
}
