import { useCallback, useMemo, useState } from 'react'
import { useErpStore } from '@/store/erpStore'
import type { InventoryFilter } from '@/features/inventory/types'
import type { StockLevelFilter } from '@/features/inventory/types'
import {
  LEVEL_FILTER_OPTIONS,
  matchesFilter,
  rowToneOf,
  toSerialRows,
  toStockRows,
  toSummaryItems,
  warehouseFilterOptions,
} from '@/features/inventory/utils'
import type { InventoryPageState } from './types'

const EMPTY_FILTER: InventoryFilter = {
  level: 'ALL',
  warehouseCode: 'ALL',
  keyword: '',
}

/**
 * 재고 현황 화면의 상태.
 *
 * 재고를 바꾸는 액션이 없는 화면이다. 예약·출고는 주문 단위로만 일어나고(전량 아니면
 * 전무), 입고는 문서 단위로만 일어난다 — 창고 재고를 직접 고치는 버튼을 여기 두면
 * 그 두 규칙을 우회하는 길이 생긴다.
 *
 * 여기서 하는 일은 재고와 입고예정을 한 줄로 합치고, 필터를 걸고, 개체 목록을 여는
 * 것뿐이다. 가용재고 계산은 도메인이 끝냈다 (가이드 §30).
 */
export function useInventoryPage(): InventoryPageState {
  const items = useErpStore((state) => state.items)
  const warehouses = useErpStore((state) => state.warehouses)
  const inventories = useErpStore((state) => state.inventories)
  const serials = useErpStore((state) => state.serials)
  const incomingDocuments = useErpStore((state) => state.incomingDocuments)
  const baseAt = useErpStore((state) => state.baseAt)

  const [filter, setFilterState] = useState<InventoryFilter>(EMPTY_FILTER)
  /** 서랍은 행 키만 들고 있는다 — 행 객체를 들면 입고 후에도 옛 숫자를 보여준다 */
  const [openedKey, setOpenedKey] = useState<string | null>(null)

  const allRows = useMemo(
    () => toStockRows({ items, warehouses, inventories, serials, incomingDocuments }),
    [items, warehouses, inventories, serials, incomingDocuments],
  )

  const rows = useMemo(() => allRows.filter((row) => matchesFilter(row, filter)), [allRows, filter])

  /** 같은 카드를 다시 누르면 해제 — 필터를 풀 길이 카드 자체여야 한다 */
  const selectLevel = useCallback((next: StockLevelFilter) => {
    setFilterState((previous) => ({
      ...previous,
      level: previous.level === next ? 'ALL' : next,
    }))
  }, [])

  const summaryItems = useMemo(
    () => toSummaryItems(allRows, { current: filter.level, onSelect: selectLevel }),
    [allRows, filter.level, selectLevel],
  )

  const warehouseOptions = useMemo(() => warehouseFilterOptions(warehouses), [warehouses])

  const drawer = useMemo(() => {
    if (!openedKey) return null
    const row = allRows.find((candidate) => candidate.key === openedKey)
    if (!row) return null
    return { row, serials: toSerialRows(serials, row.itemCode, row.warehouseCode) }
  }, [openedKey, allRows, serials])

  const setFilter = useCallback((patch: Partial<InventoryFilter>) => {
    setFilterState((previous) => ({ ...previous, ...patch }))
  }, [])

  return {
    rows,
    totalCount: allRows.length,

    filter,
    setFilter,
    resetFilter: useCallback(() => setFilterState(EMPTY_FILTER), []),
    filtered:
      filter.level !== 'ALL' || filter.warehouseCode !== 'ALL' || filter.keyword.trim() !== '',

    levelOptions: LEVEL_FILTER_OPTIONS,
    warehouseOptions,

    summaryItems,
    rowTone: rowToneOf,

    drawer,
    openSerials: (row) => setOpenedKey(row.serialManaged ? row.key : null),
    closeSerials: () => setOpenedKey(null),

    baseAt,
  }
}
