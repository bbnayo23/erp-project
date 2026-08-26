import { useCallback, useMemo, useState } from 'react'
import { useErpStore } from '@/store/erpStore'
import { usePreparationPlan } from '@/store/hooks'
import type { PreparationFilter } from '@/features/preparation/types'
import {
  STATUS_FILTER_OPTIONS,
  matchesFilter,
  toPreparationRow,
  toSummaryItems,
  warehouseFilterOptions,
} from '@/features/preparation/utils'
import type { PreparationPageState } from './types'

const EMPTY_FILTER: PreparationFilter = {
  status: 'ALL',
  warehouseCode: 'ALL',
  keyword: '',
}

/**
 * 배송 준비 현황 화면의 상태.
 *
 * 판정은 전부 도메인에서 끝나 있다. 여기서 하는 일은 계획을 표 한 줄로 옮기고,
 * 필터를 걸고, 요약을 세는 것뿐이다 — 재고 계산은 한 줄도 없다 (가이드 §30).
 */
export function usePreparationPage(): PreparationPageState {
  const plan = usePreparationPlan()

  const items = useErpStore((state) => state.items)
  const warehouses = useErpStore((state) => state.warehouses)
  const baseAt = useErpStore((state) => state.baseAt)

  const [filter, setFilterState] = useState<PreparationFilter>(EMPTY_FILTER)

  // 계획은 이미 배송일 순서다. 여기서 다시 정렬하면 배정 순서와 목록 순서가 어긋난다.
  const allRows = useMemo(
    () => plan.entries.map((entry) => toPreparationRow(entry, items, warehouses, baseAt)),
    [plan, items, warehouses, baseAt],
  )

  const rows = useMemo(() => allRows.filter((row) => matchesFilter(row, filter)), [allRows, filter])

  const summaryItems = useMemo(() => toSummaryItems(allRows), [allRows])

  const warehouseOptions = useMemo(() => warehouseFilterOptions(warehouses), [warehouses])

  const setFilter = useCallback((patch: Partial<PreparationFilter>) => {
    setFilterState((previous) => ({ ...previous, ...patch }))
  }, [])

  const resetFilter = useCallback(() => setFilterState(EMPTY_FILTER), [])

  return {
    rows,
    totalCount: allRows.length,

    filter,
    setFilter,
    resetFilter,
    filtered:
      filter.status !== 'ALL' || filter.warehouseCode !== 'ALL' || filter.keyword.trim() !== '',

    statusOptions: STATUS_FILTER_OPTIONS,
    warehouseOptions,

    summaryItems,
    baseAt,
  }
}
