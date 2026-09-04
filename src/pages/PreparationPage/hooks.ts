import { useCallback, useMemo, useState } from 'react'
import { useErpStore } from '@/store/erpStore'
import { usePreparationPlan } from '@/store/hooks'
import type { PreparationFilter } from '@/features/preparation/types'
import {
  STATUS_FILTER_OPTIONS,
  deliveryDateFilterOptions,
  groupByDeliveryDate,
  matchesFilter,
  rowToneOf,
  toPreparationRow,
  toSummaryItems,
  warehouseFilterOptions,
  type SummarySelection,
} from '@/features/preparation/utils'
import type { PreparationPageState } from './types'

const EMPTY_FILTER: PreparationFilter = {
  status: 'ALL',
  warehouseCode: 'ALL',
  deliveryDate: 'ALL',
  keyword: '',
  reserved: 'ALL',
  includeExcluded: false,
}

/** 예약 여부 필터 — 준비상태와 다른 축이라 셀렉트를 따로 둔다 */
export const RESERVED_FILTER_OPTIONS = [
  { value: 'ALL', label: '예약 전체' },
  { value: 'UNRESERVED', label: '예약 전' },
  { value: 'RESERVED', label: '예약 완료' },
]

/**
 * 배송 준비 현황 화면의 상태.
 *
 * 판정은 전부 도메인에서 끝나 있다. 여기서 하는 일은 계획을 표 한 줄로 옮기고,
 * 필터를 걸고, 지표를 세는 것뿐이다 — 재고 계산은 한 줄도 없다 (가이드 §30).
 */
export const usePreparationPage = (): PreparationPageState => {
  const plan = usePreparationPlan()

  const items = useErpStore((state) => state.items)
  const warehouses = useErpStore((state) => state.warehouses)
  const baseAt = useErpStore((state) => state.baseAt)

  const [filter, setFilterState] = useState<PreparationFilter>(EMPTY_FILTER)

  // 계획은 이미 배송일 순서다. 여기서 다시 정렬하면 배정 순서와 목록 순서가 어긋난다.
  const allRows = useMemo(
    () =>
      [...plan.entries, ...plan.excluded].map((entry) =>
        toPreparationRow(entry, items, warehouses, baseAt),
      ),
    [plan, items, warehouses, baseAt],
  )

  const rows = useMemo(() => allRows.filter((row) => matchesFilter(row, filter)), [allRows, filter])

  /** 표는 배송일로 묶어 그린다 — 담당자가 '오늘 몇 건' 을 눈으로 세지 않아도 되게 */
  const groups = useMemo(() => groupByDeliveryDate(rows), [rows])

  const setFilter = useCallback((patch: Partial<PreparationFilter>) => {
    setFilterState((previous) => ({ ...previous, ...patch }))
  }, [])

  const resetFilter = useCallback(() => setFilterState(EMPTY_FILTER), [])

  /** 지표 카드에서 오는 선택은 상태와 예약 축을 한 번에 바꾼다 */
  const selectSummary = useCallback((next: SummarySelection) => {
    setFilterState((previous) =>
      previous.status === next.status && previous.reserved === next.reserved
        ? // 같은 카드를 다시 누르면 해제 — 필터를 풀 길이 카드 자체여야 한다
          { ...previous, status: 'ALL', reserved: 'ALL' }
        : { ...previous, status: next.status, reserved: next.reserved },
    )
  }, [])

  const summarySelection = useMemo<SummarySelection>(
    () => ({ status: filter.status, reserved: filter.reserved }),
    [filter.status, filter.reserved],
  )

  const summaryItems = useMemo(
    () =>
      toSummaryItems(
        allRows.filter((row) => !row.excluded),
        { current: summarySelection, onSelect: selectSummary },
      ),
    [allRows, summarySelection, selectSummary],
  )

  const warehouseOptions = useMemo(() => warehouseFilterOptions(warehouses), [warehouses])

  const deliveryDateOptions = useMemo(() => deliveryDateFilterOptions(allRows), [allRows])

  /** 제외 주문을 뺀 건수 — 요약과 결과 수는 준비 대상만 센다 */
  const targetCount = useMemo(() => allRows.filter((row) => !row.excluded).length, [allRows])

  return {
    rows,
    groups,
    totalCount: targetCount,

    filter,
    setFilter,
    resetFilter,
    filtered:
      filter.status !== 'ALL' ||
      filter.warehouseCode !== 'ALL' ||
      filter.deliveryDate !== 'ALL' ||
      filter.reserved !== 'ALL' ||
      filter.includeExcluded ||
      filter.keyword.trim() !== '',

    statusOptions: STATUS_FILTER_OPTIONS,
    reservedOptions: RESERVED_FILTER_OPTIONS,
    warehouseOptions,
    deliveryDateOptions,

    summaryItems,
    rowTone: rowToneOf,

    baseAt,
  }
}
