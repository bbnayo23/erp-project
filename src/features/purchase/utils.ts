import type { StatusDescriptor } from '@/components/common/StatusBadge'
import type { PurchaseOrderStatus } from './types'

export const PURCHASE_STATUS: Record<PurchaseOrderStatus, StatusDescriptor> = {
  DRAFT: { label: '작성중', tone: 'neutral' },
  ORDERED: { label: '발주완료', tone: 'primary' },
  PARTIALLY_RECEIVED: { label: '부분입고', tone: 'warning' },
  RECEIVED: { label: '입고완료', tone: 'success' },
  CANCELLED: { label: '취소', tone: 'danger' },
}

export const PURCHASE_STATUS_ORDER: PurchaseOrderStatus[] = [
  'DRAFT',
  'ORDERED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
]

/** 입고를 더 받을 수 있는 상태인가 */
export const canReceive = (status: PurchaseOrderStatus) =>
  status === 'DRAFT' || status === 'ORDERED' || status === 'PARTIALLY_RECEIVED'

/** 진행률(0~1)을 퍼센트 문자열로 */
export const formatProgress = (progress: number) => `${Math.round(progress * 100)}%`
