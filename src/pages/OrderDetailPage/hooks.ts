import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useErpStore } from '@/store/erpStore'
import { usePreparationPlan } from '@/store/hooks'
import { findPlanEntry } from '@/domain/preparation/planPreparation'
import { calculateShortage } from '@/domain/purchase/calculateShortage'
import { findItem } from '@/domain/master/itemRules'
import { findWarehouse } from '@/domain/master/warehouseRules'
import { ACTION_SUCCESS } from '@/features/preparation/messages'
import { useActionReport } from '@/features/preparation/useActionReport'
import {
  PREPARATION_STATUS,
  RESERVED_STATUS,
  currentStep,
  describePreparation,
  statusDescriptorOf,
  toIncomingRow,
  toItemRows,
  toOrderSteps,
  toOrderedItemRows,
  toPreparationRow,
  toSerialRows,
} from '@/features/preparation/utils'
import type { UnsavedAlert, UnsavedAlertKind } from '@/features/preparation/types'
import { diffDays, formatDate, formatDateTime, formatDueLabel } from '@/utils/date'
import type { OrderDetailPageState } from './types'

/**
 * 확인창 문구.
 *
 * 두 경로가 잃는 것은 같다 — 입력한 입고 수량이다. 그래서 설명도 같은 문장을 쓰고
 * 제목과 버튼만 가른다. 문구가 갈리면 담당자가 두 창을 다른 사건으로 읽는다.
 */
const UNSAVED_DESCRIPTION =
  '입력한 입고 수량이 아직 처리되지 않았습니다. 지금 나가면 입력한 값은 저장되지 않습니다.'

const UNSAVED_ALERT: Record<UnsavedAlertKind, UnsavedAlert> = {
  LEAVE: {
    kind: 'LEAVE',
    title: '저장하지 않고 목록으로 나갈까요?',
    description: UNSAVED_DESCRIPTION,
    confirmLabel: '나가기',
    cancelLabel: '취소',
  },
  DISCARD: {
    kind: 'DISCARD',
    title: '입력한 값을 취소할까요?',
    description: UNSAVED_DESCRIPTION,
    // 트리거 버튼과 같은 이름을 쓰지 않는다 — 무엇이 일어나는지를 버튼이 말해야 한다
    confirmLabel: '값 버리기',
    cancelLabel: '취소',
  },
}

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
  const navigate = useNavigate()
  const plan = usePreparationPlan()

  const items = useErpStore((state) => state.items)
  const bundleComponents = useErpStore((state) => state.bundleComponents)
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

  const report = useActionReport()

  const [receipts, setReceipts] = useState<Record<string, string>>({})
  const [alert, setAlert] = useState<UnsavedAlert | null>(null)

  /**
   * 요청 토큰. 성공한 뒤에만 올린다.
   *
   * 같은 버튼을 두 번 누르면 토큰이 같아 두 번째 요청이 DUPLICATE_REQUEST 로 막히고,
   * 담당자가 일부러 다시 입고하는 경우에는 토큰이 올라가 정당한 새 요청이 된다.
   * 시각이나 난수로 만들면 이 구분이 사라진다.
   */
  const [token, setToken] = useState(0)

  const entry = findPlanEntry(plan, orderId)

  // 이 주문이 걸려 있는 부족분. 품목 × 창고로 합산돼 있으므로 같은 품목을 기다리는
  // 다른 주문의 몫까지 한 번에 발주된다 — 주문마다 따로 내면 재고가 남는다.
  const shortageLines = useMemo(
    () => calculateShortage(plan).filter((line) => line.orderIds.includes(orderId)),
    [plan, orderId],
  )

  /**
   * 레일에 세울 주문들. 목록 화면과 같은 행 모델을 쓴다 — 두 화면이 같은 순서·같은
   * 배지를 보여야 담당자가 '아까 그 주문' 을 알아본다.
   */
  const railOrders = useMemo(
    () => plan.entries.map((candidate) => toPreparationRow(candidate, items, warehouses, baseAt)),
    [plan, items, warehouses, baseAt],
  )

  const steps = useMemo(
    () => (entry ? toOrderSteps(entry.preparation, entry.reserved, entry.order.status) : []),
    [entry],
  )

  const orderedRows = useMemo(
    () => (entry ? toOrderedItemRows(entry.order, items, bundleComponents) : []),
    [entry, items, bundleComponents],
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

  /**
   * 기본값을 그대로 둔 문서는 입력한 것이 아니다.
   *
   * receipts 에 키가 있다는 것만으로 판단하면, 담당자가 값을 고쳤다가 원래 숫자로
   * 되돌려 놓은 경우에도 확인창이 뜬다.
   */
  const dirty = useMemo(
    () =>
      Object.entries(receipts).some(([documentId, value]) => {
        const row = incomingRows.find((candidate) => candidate.documentId === documentId)
        return value !== String(row?.remainingQuantity ?? 0)
      }),
    [receipts, incomingRows],
  )

  const leave = useCallback(() => navigate('/orders'), [navigate])

  const preparation = entry?.preparation
  const reserved = entry?.reserved ?? false
  const status = preparation?.status ?? 'EXCEPTION'

  const issueQuantity = shortageLines.reduce((acc, line) => acc + line.shortageQuantity, 0)

  return {
    found: entry !== undefined,
    orderId,

    summary,
    status,
    // 주문을 못 찾으면 판정 자체가 없다 — 예약 완료로 보이면 안 된다
    statusDescriptor: preparation
      ? reserved
        ? RESERVED_STATUS
        : statusDescriptorOf(preparation)
      : PREPARATION_STATUS.EXCEPTION,
    detail: preparation ? describePreparation(preparation, items, reserved) : '',
    reserved,

    blocks: preparation?.blockingReasons ?? [],
    excludedItemNames: (preparation?.excludedItemCodes ?? []).map(
      (itemCode) => findItem(items, itemCode)?.itemName ?? itemCode,
    ),

    railOrders,
    steps,
    ...(currentStep(steps) ? { currentStep: currentStep(steps) } : {}),

    orderedRows,
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

    dirty,

    alert,
    // 입력한 값이 없으면 묻지 않는다 — 물을 것이 없는데 창을 띄우면 담당자가 창을 무시하게 된다
    requestLeave: () => (dirty ? setAlert(UNSAVED_ALERT.LEAVE) : leave()),
    requestDiscard: () => dirty && setAlert(UNSAVED_ALERT.DISCARD),
    confirmAlert: () => {
      if (alert?.kind === 'LEAVE') leave()
      // 두 경로 모두 입력을 버린다. 나가는 쪽은 화면이 사라지지만, 뒤로 돌아왔을 때
      // 옛 입력이 남아 있으면 방금 버린 값이 되살아난 것처럼 보인다.
      setReceipts({})
      setAlert(null)
    },
    cancelAlert: () => setAlert(null),

    reserve: () => {
      report(reserveOrder(orderId), ACTION_SUCCESS.RESERVE)
    },
    release: () => {
      report(releaseOrder(orderId), ACTION_SUCCESS.RELEASE)
    },
    ship: () => {
      report(shipOrder(orderId), ACTION_SUCCESS.SHIP)
    },
    issue: () => {
      // 성공했을 때만 토큰을 올린다 — 같은 부족분으로 두 번 누르면 토큰이 같아 막힌다
      if (report(issueIncoming(shortageLines, `ISSUE:${orderId}:${token}`), ACTION_SUCCESS.ISSUE)) {
        setToken((previous) => previous + 1)
      }
    },

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

    baseAt,
  }
}
