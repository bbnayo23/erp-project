import type { NavItem } from './types'

/** 재고 → 수주 → 발주. 실제 업무가 흐르는 순서대로 둔다. */
export const NAVIGATION: NavItem[] = [
  { label: '재고', to: '/inventory', icon: 'inventory' },
  { label: '수주', to: '/orders', icon: 'orders' },
  { label: '발주', to: '/purchase', icon: 'purchase' },
]
