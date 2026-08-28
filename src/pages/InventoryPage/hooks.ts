import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useErpStore } from '@/store/erpStore'
import type { InventoryFilter } from '@/features/inventory/types'
import type { StockLevelFilter } from '@/features/inventory/types'
import {
  LEVEL_FILTER_OPTIONS,
  matchesFilter,
  rowToneOf,
  toItemDemandRows,
  toItemDocumentRows,
  toMovementRows,
  toSerialRows,
  toStockRows,
  toSummaryItems,
  warehouseFilterOptions,
} from '@/features/inventory/utils'
import { usePreparationPlan } from '@/store/hooks'
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
  // 계획은 스토어 훅이 만든다. 여기서 컨텍스트를 다시 조립하면 계획을 만드는 법이
  // 두 곳으로 갈라져, 판정에 필요한 컬렉션이 늘 때 한쪽만 고치는 일이 생긴다.
  const plan = usePreparationPlan()

  const items = useErpStore((state) => state.items)
  const warehouses = useErpStore((state) => state.warehouses)
  const inventories = useErpStore((state) => state.inventories)
  const serials = useErpStore((state) => state.serials)
  const incomingDocuments = useErpStore((state) => state.incomingDocuments)
  const suppliers = useErpStore((state) => state.suppliers)
  const stockMovements = useErpStore((state) => state.stockMovements)
  const baseAt = useErpStore((state) => state.baseAt)

  const [filter, setFilterState] = useState<InventoryFilter>(EMPTY_FILTER)

  /**
   * 열려 있는 품목은 URL 이 정한다.
   *
   * 행 키를 상태로 들고 있던 자리다 — 딥링크로 열 수 있어야 다른 화면에서 '이 품목
   * 보기' 로 건너올 수 있고, 새로고침해도 보던 품목이 남는다.
   * 키(`품목:창고`)의 콜론은 URL 에서 그대로 쓸 수 있다.
   */
  const navigate = useNavigate()
  const { itemKey } = useParams()
  const openedKey = itemKey ?? null

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

  const movements = useMemo(
    () => toMovementRows(stockMovements, { items, warehouses }),
    [stockMovements, items, warehouses],
  )

  const drawer = useMemo(() => {
    if (!openedKey) return null
    const row = allRows.find((candidate) => candidate.key === openedKey)
    if (!row) return null

    // 대기 주문은 계획이 이미 답을 갖고 있다. 이 화면에서 다시 세면 배정 순서가 어긋난다.
    return {
      row,
      serials: toSerialRows(serials, row.itemCode, row.warehouseCode),
      demands: toItemDemandRows(plan, row.itemCode, row.warehouseCode),
      documents: toItemDocumentRows(
        { incomingDocuments, suppliers, baseAt },
        row.itemCode,
        row.warehouseCode,
      ),
      movements: movements.filter(
        (movement) =>
          movement.itemCode === row.itemCode && movement.warehouseCode === row.warehouseCode,
      ),
    }
  }, [openedKey, allRows, plan, serials, incomingDocuments, suppliers, movements, baseAt])

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
    // 시리얼 품목이 아니어도 연다 — 대기 주문과 입고예정은 모든 품목에 있다
    openDetail: (row) => navigate(`/items/${encodeURIComponent(row.key)}`),
    closeDetail: () => navigate('/items'),

    movements,

    baseAt,
  }
}
