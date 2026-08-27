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
  /** 필터 초기화 — 처음 상태로 되돌린다 */
  | 'reset'
  /** 새로 만든다 — 발주 생성 */
  | 'plus'
  /** 창고로 들어온다 — 입고 */
  | 'inbound'
  /** 창고에서 나간다 — 출고 */
  | 'outbound'
  /** 재고를 이 주문에 묶는다 — 예약 */
  | 'lock'
  /** 묶은 것을 푼다 — 예약 해제 */
  | 'unlock'
  /** 되돌아간다 — 목록으로 · 입력 취소 */
  | 'back'

export interface IconProps {
  name: IconName
  /** px. 기본 18 */
  size?: number
  className?: string
}
