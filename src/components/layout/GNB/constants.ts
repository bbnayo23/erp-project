import type { NavItem } from './types'

/**
 * 제품 → 주문 → 발주.
 *
 * 담당자가 하루를 여는 순서다. 먼저 '지금 창고에 무엇이 얼마나 있는가'(제품)를 확인하고,
 * 그 재고로 '무엇을 내보낼 수 있는가'(주문)를 판단하고, 모자라면 '무엇을 채울
 * 것인가'(발주)로 간다.
 */
export const NAVIGATION: NavItem[] = [
  { label: '제품', to: '/items', icon: 'inventory' },
  { label: '주문', to: '/orders', icon: 'orders' },
  { label: '발주', to: '/inbound', icon: 'purchase' },
]
