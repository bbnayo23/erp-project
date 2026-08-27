export type IconName =
  | 'close'
  | 'sun'
  | 'moon'
  | 'inventory'
  | 'orders'
  | 'purchase'
  /** 워크플로우 가이드 — 다음 작업으로 넘어가는 화살표 */
  | 'arrowRight'
  /** 검사 통과 */
  | 'check'
  /** 처리할 일이 남았다 */
  | 'alert'
  /** 기다리는 중 */
  | 'clock'
  /** 셀렉트 화살표 — 네이티브 화살표를 지우고 직접 그린다 */
  | 'chevronDown'

export interface IconProps {
  name: IconName
  /** px. 기본 18 */
  size?: number
  className?: string
}
