import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { serialRepository } from '@/data/repositories/serialRepository'
import { isSerialManaged, findItem } from '@/domain/master/itemRules'
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

  const serials = useErpStore((state) => state.serials)

  const receiveIncoming = useErpStore((state) => state.receive)
  const inspectDocument = useErpStore((state) => state.inspect)
  const confirmDocument = useErpStore((state) => state.confirm)

  const report = useActionReport()

  const navigate = useNavigate()
  /** 열려 있는 문서는 URL 이 정한다 — 딥링크로 바로 열 수 있어야 한다 */
  const { documentId: openId } = useParams()

  const [filter, setFilterState] = useState<PurchaseFilter>(EMPTY_FILTER)

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

  const openDocument = useMemo(
    () => allRows.find((row) => row.documentId === openId) ?? null,
    [allRows, openId],
  )

  const openItem = openDocument ? findItem(items, openDocument.itemCode) : undefined
  const serialManaged = openItem ? isSerialManaged(openItem) : false

  /**
   * 자동 채번한 시리얼번호.
   *
   * 잔여 전량 기준으로 미리 만든다 — 담당자가 수량을 줄이면 앞에서부터 잘라 쓰고,
   * 늘릴 수는 없으므로(잔여가 상한) 모자랄 일이 없다.
   */
  const suggestedSerials = useMemo(() => {
    if (!openDocument || !serialManaged) return []
    return serialRepository.nextSerialNumbers(
      serials,
      openDocument.itemCode,
      openDocument.remainingQuantity,
    )
  }, [openDocument, serialManaged, serials])

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

    openDocument,
    suggestedSerials,
    serialManaged,

    openReceipt: (documentId) => navigate(`/inbound/${documentId}`),
    closeReceipt: () => navigate('/inbound'),

    submitReceipt: (draft) => {
      if (!openDocument) return

      /*
       * 생산의뢰는 검사 기록이 먼저다. 검사가 실패하면 입고로 넘어가지 않는다 —
       * 두 처리를 한 번에 보내지만 순서는 규칙이다.
       */
      if (draft.inspection) {
        const inspected = inspectDocument(openDocument.documentId, {
          passedQuantity: draft.inspection.passedQuantity,
          failedQuantity: draft.inspection.failedQuantity,
          ...(draft.inspection.note ? { note: draft.inspection.note } : {}),
        })
        if (!report(inspected, ACTION_SUCCESS.INSPECT)) return

        // 전량 불합격이면 들어올 것이 없다. 문서만 닫고 끝낸다.
        if (draft.quantity <= 0) {
          navigate('/inbound')
          return
        }
      }

      const outcome = receiveIncoming(
        openDocument.documentId,
        draft.quantity,
        `RECEIVE:${openDocument.documentId}:${token}`,
        draft.serialNumbers.length > 0 ? draft.serialNumbers : undefined,
      )

      if (report(outcome, ACTION_SUCCESS.RECEIVE)) {
        // 성공했을 때만 토큰을 올린다 — 같은 버튼을 두 번 누르면 토큰이 같아 막힌다
        setToken((previous) => previous + 1)
        navigate('/inbound')
      }
    },

    confirm: (documentId) => {
      report(confirmDocument(documentId), ACTION_SUCCESS.CONFIRM)
    },

    history,

    baseAt,
  }
}
