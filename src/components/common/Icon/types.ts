export type IconName = 'close' | 'sun' | 'moon' | 'inventory' | 'orders' | 'purchase'

export interface IconProps {
  name: IconName
  /** px. 기본 18 */
  size?: number
  className?: string
}
