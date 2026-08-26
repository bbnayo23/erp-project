import type { StatusDescriptor } from '@/components/common/StatusBadge'
import type { ItemType, StockLevel } from './types'

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  SINGLE: '단품',
  BUNDLE: '번들',
}

export const STOCK_LEVEL_STATUS: Record<StockLevel, StatusDescriptor> = {
  OUT_OF_STOCK: { label: '재고 없음', tone: 'danger' },
  BELOW_SAFETY: { label: '안전재고 미달', tone: 'warning' },
  HEALTHY: { label: '정상', tone: 'success' },
}

/**
 * 가용 재고를 세 단계로 나눈다.
 * 안전재고를 기준으로 두는 이유: 0 이 되기 전에 손을 쓰지 않으면 이미 늦다.
 */
export function resolveStockLevel(available: number, safetyStock: number): StockLevel {
  if (available <= 0) return 'OUT_OF_STOCK'
  if (available < safetyStock) return 'BELOW_SAFETY'
  return 'HEALTHY'
}

export const EMPTY_INVENTORY_FILTER = {
  keyword: '',
  warehouseId: 'ALL' as const,
  onlyRisk: false,
}
