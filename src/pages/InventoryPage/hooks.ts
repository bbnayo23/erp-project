import { useMemo } from 'react'
import { useInventoryRows } from '@/features/inventory/hooks'
import { useErpStore } from '@/store/erpStore'
import { formatNumber } from '@/utils/number'
import type { UseInventoryPageResult } from './types'

/** 화면이 필요한 값만 골라 넘긴다 — 페이지 컴포넌트는 마크업만 담당한다 */
export function useInventoryPage(): UseInventoryPageResult {
  const warehouses = useErpStore((state) => state.warehouses)
  const { rows, filter, setFilter, summary } = useInventoryRows()

  const warehouseOptions = useMemo(
    () => [
      { value: 'ALL', label: '전체 창고' },
      ...warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name })),
    ],
    [warehouses],
  )

  const summaryItems = useMemo(
    () => [
      { label: '재고 항목', value: formatNumber(summary.total), hint: '품목 × 창고' },
      {
        label: '재고 없음',
        value: formatNumber(summary.outOfStock),
        hint: '가용 0',
        tone: summary.outOfStock > 0 ? ('danger' as const) : ('default' as const),
      },
      {
        label: '안전재고 미달',
        value: formatNumber(summary.belowSafety),
        tone: summary.belowSafety > 0 ? ('warning' as const) : ('default' as const),
      },
      {
        label: '소요량 미충족',
        value: formatNumber(summary.uncovered),
        hint: '가용 + 입고예정 < 소요량',
        tone: summary.uncovered > 0 ? ('danger' as const) : ('default' as const),
      },
    ],
    [summary],
  )

  return { rows, filter, setFilter, warehouseOptions, summaryItems }
}
