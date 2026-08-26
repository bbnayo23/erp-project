import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { ActionOutcome } from '@/store/erpStore'
import { useErpStore } from '@/store/erpStore'
import { usePreparationPlan } from '@/store/hooks'
import { findPlanEntry } from '@/domain/preparation/planPreparation'
import { calculateShortage } from '@/domain/purchase/calculateShortage'
import { findItem } from '@/domain/master/itemRules'
import { findWarehouse } from '@/domain/master/warehouseRules'
import { ACTION_FAILURE, ACTION_SUCCESS } from '@/features/preparation/messages'
import {
  PREPARATION_STATUS,
  RESERVED_STATUS,
  describePreparation,
  toIncomingRow,
  toItemRows,
  toSerialRows,
} from '@/features/preparation/utils'
import { diffDays, formatDate, formatDateTime, formatDueLabel } from '@/utils/date'
import type { OrderDetailPageState, OrderNotice } from './types'

const EMPTY_SUMMARY = {
  orderId: '',
  orderStatus: '',
  orderedAtLabel: '-',
  deliveryLabel: '-',
  dueLabel: '-',
  overdue: false,
  warehouseName: '-',
  warehouseCode: '',
}

/**
 * 주문 상세 화면의 상태와 액션.
 *
 * 액션은 전부 스토어를 부르고 결과 코드만 받는다. 재고를 여기서 계산하거나 판정을 다시
 * 하지 않는다 — 화면이 판단하면 스토어가 다시 확인하는 의미가 없어진다 (가이드 §11).
 */
export function useOrderDetailPage(): OrderDetailPageState {
  const { orderId = '' } = useParams()
  const plan = usePreparationPlan()

  const items = useErpStore((state) => state.items)
  const warehouses = useErpStore((state) => state.warehouses)
  const suppliers = useErpStore((state) => state.suppliers)
  const serials = useErpStore((state) => state.serials)
  const incomingDocuments = useErpStore((state) => state.incomingDocuments)
  const baseAt = useErpStore((state) => state.baseAt)

  const reserveOrder = useErpStore((state) => state.reserve)
  const releaseOrder = useErpStore((state) => state.release)
  const shipOrder = useErpStore((state) => state.ship)
  const issueIncoming = useErpStore((state) => state.issueIncoming)
  const receiveIncoming = useErpStore((state) => state.receive)
  const inspectDocument = useErpStore((state) => state.inspect)

  const [notice, setNotice] = useState<OrderNotice | null>(null)
  const [receipts, setReceipts] = useState<Record<string, string>>({})

  /**
   * 요청 토큰. 성공한 뒤에만 올린다.
   *
   * 같은 버튼을 두 번 누르면 토큰이 같아 두 번째 요청이 DUPLICATE_REQUEST 로 막히고,
   * 담당자가 일부러 다시 입고하는 경우에는 토큰이 올라가 정당한 새 요청이 된다.
   * 시각이나 난수로 만들면 이 구분이 사라진다.
   */
  const [token, setToken] = useState(0)

  const entry = findPlanEntry(plan, orderId)

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

  // 이 주문이 걸려 있는 부족분. 품목 × 창고로 합산돼 있으므로 같은 품목을 기다리는
  // 다른 주문의 몫까지 한 번에 발주된다 — 주문마다 따로 내면 재고가 남는다.
  const shortageLines = useMemo(
    () => calculateShortage(plan).filter((line) => line.orderIds.includes(orderId)),
    [plan, orderId],
  )

  const itemRows = useMemo(
    () => (entry ? toItemRows(entry.preparation, items) : []),
    [entry, items],
  )

  const serialRows = useMemo(() => toSerialRows(serials, items, orderId), [serials, items, orderId])

  /**
   * 이 주문과 관련된 입고예정 문서.
   *
   * 배송일을 맞추지 못하는 문서도 보여준다. 재고가 부족한데 발주가 이미 있을 때,
   * 담당자가 알아야 하는 것은 '없다' 가 아니라 '있지만 늦게 온다' 다.
   */
  const incomingRows = useMemo(() => {
    if (!entry) return []

    const wanted = new Set(entry.preparation.items.map((item) => item.itemCode))

    return incomingDocuments
      .filter(
        (document) =>
          document.relatedOrderId === orderId ||
          (wanted.has(document.itemCode) &&
            document.warehouseCode === entry.order.warehouseCode &&
            document.plannedQuantity > document.receivedQuantity),
      )
      .map((document) => toIncomingRow(document, items, suppliers, entry.order.deliveryDate))
  }, [entry, incomingDocuments, items, suppliers, orderId])

  const summary = useMemo(() => {
    if (!entry) return EMPTY_SUMMARY
    const { order } = entry

    return {
      orderId: order.orderId,
      orderStatus: order.status,
      orderedAtLabel: formatDateTime(order.orderedAt),
      deliveryLabel: formatDate(order.deliveryDate),
      dueLabel: formatDueLabel(order.deliveryDate, baseAt),
      overdue: diffDays(baseAt, order.deliveryDate) < 0,
      warehouseName:
        findWarehouse(warehouses, order.warehouseCode)?.warehouseName ?? order.warehouseCode,
      warehouseCode: order.warehouseCode,
    }
  }, [entry, warehouses, baseAt])

  const receiptQuantity = useCallback(
    (documentId: string) => {
      const override = receipts[documentId]
      if (override !== undefined) return override
      // 기본값은 잔여 전량 — 부분 입고가 예외이고 전량 입고가 보통이다
      const row = incomingRows.find((candidate) => candidate.documentId === documentId)
      return String(row?.remainingQuantity ?? 0)
    },
    [receipts, incomingRows],
  )

  const preparation = entry?.preparation
  const reserved = entry?.reserved ?? false
  const status = preparation?.status ?? 'EXCEPTION'

  const issueQuantity = shortageLines.reduce((acc, line) => acc + line.shortageQuantity, 0)

  return {
    found: entry !== undefined,
    orderId,

    summary,
    status,
    statusDescriptor: reserved ? RESERVED_STATUS : PREPARATION_STATUS[status],
    detail: preparation ? describePreparation(preparation, items, reserved) : '',
    reserved,

    blocks: preparation?.blockingReasons ?? [],
    excludedItemNames: (preparation?.excludedItemCodes ?? []).map(
      (itemCode) => findItem(items, itemCode)?.itemName ?? itemCode,
    ),

    itemRows,
    serialRows,
    incomingRows,

    actions: {
      canReserve: !reserved && status === 'READY',
      canRelease: reserved,
      canShip: reserved,
      canIssue: shortageLines.length > 0,
      issueLabel: `부족분 발주 생성 (${shortageLines.length}건 ${issueQuantity}개)`,
    },

    notice,
    dismissNotice: () => setNotice(null),

    reserve: () => report(reserveOrder(orderId), ACTION_SUCCESS.RESERVE),
    release: () => report(releaseOrder(orderId), ACTION_SUCCESS.RELEASE),
    ship: () => report(shipOrder(orderId), ACTION_SUCCESS.SHIP),
    issue: () =>
      report(issueIncoming(shortageLines, `ISSUE:${orderId}:${token}`), ACTION_SUCCESS.ISSUE),

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
