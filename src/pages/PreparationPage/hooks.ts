import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFirstVisit } from '@/components/common/Tour'
import { useErpStore } from '@/store/erpStore'
import { usePreparationPlan } from '@/store/hooks'
import type { PreparationFilter } from '@/features/preparation/types'
import {
  STATUS_FILTER_OPTIONS,
  matchesFilter,
  rowToneOf,
  toPreparationRow,
  toSummaryItems,
  warehouseFilterOptions,
  type SummarySelection,
} from '@/features/preparation/utils'
import { buildWorkflowGuide } from '@/features/workflow'
import type { WorkflowStep } from '@/features/workflow'
import { PREPARATION_TOUR, TOUR_STORAGE_KEY } from './constants'
import type { PreparationPageState } from './types'

const EMPTY_FILTER: PreparationFilter = {
  status: 'ALL',
  warehouseCode: 'ALL',
  keyword: '',
  reserved: 'ALL',
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
 * 필터를 걸고, 요약과 '오늘 할 일' 을 세는 것뿐이다 — 재고 계산은 한 줄도 없다 (가이드 §30).
 */
export function usePreparationPage(): PreparationPageState {
  const navigate = useNavigate()
  const plan = usePreparationPlan()

  const items = useErpStore((state) => state.items)
  const warehouses = useErpStore((state) => state.warehouses)
  const incomingDocuments = useErpStore((state) => state.incomingDocuments)
  const baseAt = useErpStore((state) => state.baseAt)

  const [filter, setFilterState] = useState<PreparationFilter>(EMPTY_FILTER)

  // 계획은 이미 배송일 순서다. 여기서 다시 정렬하면 배정 순서와 목록 순서가 어긋난다.
  const allRows = useMemo(
    () => plan.entries.map((entry) => toPreparationRow(entry, items, warehouses, baseAt)),
    [plan, items, warehouses, baseAt],
  )

  const rows = useMemo(() => allRows.filter((row) => matchesFilter(row, filter)), [allRows, filter])

  const setFilter = useCallback((patch: Partial<PreparationFilter>) => {
    setFilterState((previous) => ({ ...previous, ...patch }))
  }, [])

  const resetFilter = useCallback(() => setFilterState(EMPTY_FILTER), [])

  /** 카드·가이드에서 오는 선택은 상태와 예약 축을 한 번에 바꾼다 */
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
    () => toSummaryItems(allRows, { current: summarySelection, onSelect: selectSummary }),
    [allRows, summarySelection, selectSummary],
  )

  const warehouseOptions = useMemo(() => warehouseFilterOptions(warehouses), [warehouses])

  const guide = useMemo(
    () => buildWorkflowGuide({ plan, incomingDocuments, baseAt }),
    [plan, incomingDocuments, baseAt],
  )

  /**
   * 화면 안내. 처음 열었을 때 한 번 자동으로 뜨고, 그 뒤에는 머리말 버튼으로 다시 본다.
   * 매번 뜨면 안내가 방해가 된다.
   *
   * 첫 방문 여부를 effect 로 옮겨 담지 않고 초기값으로 쓴다 — effect 에서 setState 하면
   * 화면이 한 번 그려진 뒤 안내가 덮이는 것처럼 보이고, 렌더가 한 번 더 돈다.
   */
  const firstVisit = useFirstVisit(TOUR_STORAGE_KEY)
  const [tourOpen, setTourOpen] = useState(firstVisit.pending)

  const closeTour = useCallback(() => {
    setTourOpen(false)
    firstVisit.complete()
  }, [firstVisit])

  /**
   * 가이드 카드를 눌렀을 때. 이 화면에서 할 수 있는 일은 필터로 좁히고,
   * 다른 화면의 일은 이동한다 — 가이드를 읽고 다시 메뉴를 찾게 하면 일이 늘어난다.
   */
  const selectStep = useCallback(
    (step: WorkflowStep) => {
      const { target } = step
      if (target.kind === 'route') {
        navigate(target.to)
        return
      }
      if (target.kind === 'reserved') {
        setFilterState((previous) => ({ ...previous, status: 'ALL', reserved: 'RESERVED' }))
        return
      }
      setFilterState((previous) => ({
        ...previous,
        status: target.status,
        // 예약 완료 주문은 이미 확보된 물량이라 '예약할 주문' 목록에서 빠져야 한다
        reserved: target.status === 'READY' ? 'UNRESERVED' : 'ALL',
      }))
    },
    [navigate],
  )

  return {
    rows,
    totalCount: allRows.length,

    filter,
    setFilter,
    resetFilter,
    filtered:
      filter.status !== 'ALL' ||
      filter.warehouseCode !== 'ALL' ||
      filter.reserved !== 'ALL' ||
      filter.keyword.trim() !== '',

    statusOptions: STATUS_FILTER_OPTIONS,
    reservedOptions: RESERVED_FILTER_OPTIONS,
    warehouseOptions,

    summaryItems,
    rowTone: rowToneOf,

    guide,
    selectStep,

    tourSteps: PREPARATION_TOUR,
    tourOpen,
    openTour: () => setTourOpen(true),
    closeTour,

    baseAt,
  }
}
