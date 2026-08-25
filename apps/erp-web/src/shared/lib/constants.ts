import type { BadgeTone } from '@erp/design-system'
import type { EmployeeStatus, OrderStatus, ProductStatus } from '@/types/domain'

interface StatusMeta<T extends string> {
  value: T
  label: string
  tone: BadgeTone
}

export const EMPLOYEE_STATUS: Record<EmployeeStatus, StatusMeta<EmployeeStatus>> = {
  active: { value: 'active', label: '재직', tone: 'success' },
  leave: { value: 'leave', label: '휴직', tone: 'warning' },
  resigned: { value: 'resigned', label: '퇴사', tone: 'neutral' },
}

export const PRODUCT_STATUS: Record<ProductStatus, StatusMeta<ProductStatus>> = {
  selling: { value: 'selling', label: '판매중', tone: 'success' },
  soldout: { value: 'soldout', label: '품절', tone: 'danger' },
  discontinued: { value: 'discontinued', label: '단종', tone: 'neutral' },
}

export const ORDER_STATUS: Record<OrderStatus, StatusMeta<OrderStatus>> = {
  draft: { value: 'draft', label: '작성중', tone: 'neutral' },
  confirmed: { value: 'confirmed', label: '확정', tone: 'primary' },
  shipped: { value: 'shipped', label: '출고', tone: 'info' },
  done: { value: 'done', label: '완료', tone: 'success' },
  canceled: { value: 'canceled', label: '취소', tone: 'danger' },
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
export const DEFAULT_PAGE_SIZE = 20
