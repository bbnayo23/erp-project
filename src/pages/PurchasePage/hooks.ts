import { useCallback, useMemo, useState } from 'react'
import type { ActionOutcome } from '@/store/erpStore'
import { useErpStore } from '@/store/erpStore'
import { ACTION_FAILURE, ACTION_SUCCESS } from '@/features/preparation/messages'
import type { PurchaseFilter } from '@/features/purchase/types'
import type { PurchaseStageFilter } from '@/features/purchase/types'
import {
  DOCUMENT_TYPE_FILTER_OPTIONS,
  STAGE_FILTER_OPTIONS,
  compareRows,
  matchesFilter,
  rowToneOf,
  toIncomingRow,
  toSummaryItems,
  warehouseFilterOptions,
} from '@/features/purchase/utils'
import type { PurchaseNotice, PurchasePageState } from './types'

const EMPTY_FILTER: PurchaseFilter = {
  stage: 'ALL',
  documentType: 'ALL',
  warehouseCode: 'ALL',
  keyword: '',
}

/**
 * 발주 현황 화면의 상태와 액션.
 *
 * 주문 상세와 같은 두 액션(검사 · 입고)을 부르지만 진입점이 다르다. 저쪽은 한 주문이
 * 기다리는 문서만 보고, 이쪽은 문서 전체를 본다 — 어느 주문에도 걸리지 않은 문서는
 * 여기서만 처리할 수 있다.
 *
 * 재고를 여기서 계산하거나 판정을 다시 하지 않는다. 액션은 스토어를 부르고 결과 코드만
 * 받는다 — 화면이 판단하면 스토어가 다시 확인하는 의미가 없어진다 (가이드 §11).
 */
export function usePurchasePage(): PurchasePageState {
  const items = useErpStore((state) => state.items)
  const warehouses = useErpStore((state) => state.warehouses)
  const suppliers = useErpStore((state) => state.suppliers)
  const incomingDocuments = useErpStore((state) => state.incomingDocuments)
  const baseAt = useErpStore((state) => state.baseAt)

  const receiveIncoming = useErpStore((state) => state.receive)
  const inspectDocument = useErpStore((state) => state.inspect)

  const [filter, setFilterState] = useState<PurchaseFilter>(EMPTY_FILTER)
  const [notice, setNotice] = useState<PurchaseNotice | null>(null)
  const [receipts, setReceipts] = useState<Record<string, string>>({})

  /**
   * 요청 토큰. 성공한 뒤에만 올린다 — 주문 상세와 같은 규칙이다.
   *
   * 같은 버튼을 두 번 누르면 토큰이 같아 두 번째가 DUPLICATE_REQUEST 로 막히고,
   * 담당자가 일부러 다시 입고하는 경우에는 토큰이 올라가 정당한 새 요청이 된다.
   */
  const [token, setToken] = useState(0)

  const report = useCallback((outcome: ActionOutcome, success: string) => {
    if (outcome.ok) {
      setNotice({ tone: 'success', message: success })
      setToken((previous) => previous + 1)
      return
    }
    setNotice({
      tone: 'danger',
      message: outcome.code ? ACTION_FAILURE[outcome.code] : '처리하지 못했습니다.',
    })
  }, [])

  const allRows = useMemo(
    () =>
      incomingDocuments
        .map((document) => toIncomingRow(document, items, warehouses, suppliers, baseAt))
        .sort(compareRows),
    [incomingDocuments, items, warehouses, suppliers, baseAt],
  )

  const rows = useMemo(() => allRows.filter((row) => matchesFilter(row, filter)), [allRows, filter])

  /** 같은 카드를 다시 누르면 해제 — 필터를 풀 길이 카드 자체여야 한다 */
  const selectStage = useCallback((next: PurchaseStageFilter) => {
    setFilterState((previous) => ({
      ...previous,
      stage: previous.stage === next ? 'ALL' : next,
    }))
  }, [])

  const summaryItems = useMemo(
    () => toSummaryItems(allRows, { current: filter.stage, onSelect: selectStage }),
    [allRows, filter.stage, selectStage],
  )

  const warehouseOptions = useMemo(() => warehouseFilterOptions(warehouses), [warehouses])

  const setFilter = useCallback((patch: Partial<PurchaseFilter>) => {
    setFilterState((previous) => ({ ...previous, ...patch }))
  }, [])

  const resetFilter = useCallback(() => setFilterState(EMPTY_FILTER), [])

  const receiptQuantity = useCallback(
    (documentId: string) => {
      const override = receipts[documentId]
      if (override !== undefined) return override
      // 기본값은 잔여 전량 — 부분 입고가 예외이고 전량 입고가 보통이다
      const row = allRows.find((candidate) => candidate.documentId === documentId)
      return String(row?.remainingQuantity ?? 0)
    },
    [receipts, allRows],
  )

  return {
    rows,
    totalCount: allRows.length,

    filter,
    setFilter,
    resetFilter,
    filtered:
      filter.stage !== 'ALL' ||
      filter.documentType !== 'ALL' ||
      filter.warehouseCode !== 'ALL' ||
      filter.keyword.trim() !== '',

    stageOptions: STAGE_FILTER_OPTIONS,
    documentTypeOptions: DOCUMENT_TYPE_FILTER_OPTIONS,
    warehouseOptions,

    summaryItems,
    rowTone: rowToneOf,

    notice,
    dismissNotice: () => setNotice(null),

    receiptQuantity,
    setReceiptQuantity: (documentId, value) =>
      setReceipts((previous) => ({ ...previous, [documentId]: value })),
    receive: (documentId) => {
      const quantity = Number(receiptQuantity(documentId))
      const outcome = receiveIncoming(
        documentId,
        Number.isFinite(quantity) ? quantity : 0,
        `RECEIVE:${documentId}:${token}`,
      )
      // 성공하면 입력을 지워 잔여수량 기준으로 다시 채워지게 한다
      if (outcome.ok) {
        setReceipts((previous) => {
          const { [documentId]: _consumed, ...rest } = previous
          return rest
        })
      }
      report(outcome, ACTION_SUCCESS.RECEIVE)
    },
    inspect: (documentId) => report(inspectDocument(documentId), ACTION_SUCCESS.INSPECT),

    baseAt,
  }
}
