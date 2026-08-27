import { useCallback, useMemo, useState } from 'react'
import { useErpStore } from '@/store/erpStore'
import { ACTION_SUCCESS } from '@/features/preparation/messages'
import { useActionReport } from '@/features/preparation/useActionReport'
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
import { toMovementRows } from '@/features/inventory/utils'
import { PREPARATION_STATUS, RESERVED_STATUS } from '@/features/preparation/utils'
import { usePreparationPlan } from '@/store/hooks'
import type { PurchasePageState } from './types'

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
  // 입고 뒤 어느 주문이 풀렸는지 보여주려면 판정이 필요하다. 계획을 만드는 법은
  // 스토어 훅 한 곳에 둔다 — 화면마다 조립하면 배정 순서가 화면마다 달라진다.
  const plan = usePreparationPlan()

  const items = useErpStore((state) => state.items)
  const warehouses = useErpStore((state) => state.warehouses)
  const suppliers = useErpStore((state) => state.suppliers)
  const incomingDocuments = useErpStore((state) => state.incomingDocuments)
  const stockMovements = useErpStore((state) => state.stockMovements)
  const baseAt = useErpStore((state) => state.baseAt)

  const receiveIncoming = useErpStore((state) => state.receive)
  const inspectDocument = useErpStore((state) => state.inspect)

  const report = useActionReport()

  const [filter, setFilterState] = useState<PurchaseFilter>(EMPTY_FILTER)
  const [receipts, setReceipts] = useState<Record<string, string>>({})

  /**
   * 요청 토큰. 성공한 뒤에만 올린다 — 주문 상세와 같은 규칙이다.
   *
   * 같은 버튼을 두 번 누르면 토큰이 같아 두 번째가 DUPLICATE_REQUEST 로 막히고,
   * 담당자가 일부러 다시 입고하는 경우에는 토큰이 올라가 정당한 새 요청이 된다.
   */
  const [token, setToken] = useState(0)

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

  /**
   * 입고 이력.
   *
   * 재고 변동 이력에서 입고만 걸러 온다. 문서 목록의 '입고수량' 은 누적 합계라 이번에
   * 얼마가 들어왔는지 말하지 않고, 그 입고로 어느 주문이 풀렸는지도 말하지 않는다.
   *
   * 주문의 준비상태는 저장된 값이 아니라 지금 다시 계산한 값이다 — 입고 후 재판정
   * 결과가 곧 담당자가 확인해야 하는 것이다.
   */
  const history = useMemo(
    () =>
      toMovementRows(stockMovements, { items, warehouses })
        .filter((movement) => movement.kind === 'RECEIVE')
        .map((movement) => {
          const entry = movement.orderId
            ? plan.entries.find((candidate) => candidate.order.orderId === movement.orderId)
            : undefined

          return {
            movementId: movement.movementId,
            itemCode: movement.itemCode,
            itemName: movement.itemName,
            warehouseName: movement.warehouseName,
            receivedQuantity: movement.currentDelta,
            currentQuantity: movement.currentQuantity,
            occurredLabel: movement.occurredLabel,
            ...(movement.documentId ? { documentId: movement.documentId } : {}),
            ...(movement.orderId ? { orderId: movement.orderId } : {}),
            ...(entry
              ? {
                  orderStatusDescriptor: entry.reserved
                    ? RESERVED_STATUS
                    : PREPARATION_STATUS[entry.preparation.status],
                }
              : {}),
          }
        }),
    [stockMovements, items, warehouses, plan],
  )

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

      if (report(outcome, ACTION_SUCCESS.RECEIVE)) {
        // 성공했을 때만 토큰을 올린다 — 같은 버튼을 두 번 누르면 토큰이 같아 막힌다
        setToken((previous) => previous + 1)
        // 입력을 비워 잔여수량 기준으로 다시 채워지게 한다
        setReceipts((previous) => {
          const { [documentId]: _consumed, ...rest } = previous
          return rest
        })
      }
    },
    inspect: (documentId) => {
      report(inspectDocument(documentId), ACTION_SUCCESS.INSPECT)
    },

    history,

    baseAt,
  }
}
