import type { StatusDescriptor } from '@/components/common/StatusBadge'
import type { OrderStatus } from './types'

export const ORDER_STATUS: Record<OrderStatus, StatusDescriptor> = {
  DRAFT: { label: '작성중', tone: 'neutral' },
  CONFIRMED: { label: '확정(미예약)', tone: 'warning' },
  PARTIALLY_ALLOCATED: { label: '부분예약', tone: 'warning' },
  ALLOCATED: { label: '예약완료', tone: 'primary' },
  SHIPPED: { label: '출하완료', tone: 'success' },
  CANCELLED: { label: '취소', tone: 'danger' },
}

/** 필터 드롭다운에 쓰는 순서 — 진행 순서대로 둔다 */
export const ORDER_STATUS_ORDER: OrderStatus[] = [
  'DRAFT',
  'CONFIRMED',
  'PARTIALLY_ALLOCATED',
  'ALLOCATED',
  'SHIPPED',
  'CANCELLED',
]

export const EMPTY_ORDER_FILTER = {
  keyword: '',
  status: 'ALL' as const,
  warehouseId: 'ALL' as const,
}
