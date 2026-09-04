import type {
  BundleComponent,
  Order,
  ISODateString,
  IncomingDocument,
  Item,
  OrderPreparation,
  PreparationStatus,
  PreparationWaitingReason,
  SerialInventory,
  Supplier,
  Warehouse,
} from '@/types'
import type { RowTone } from '@/components/common/DataTable'
import type { StatusDescriptor } from '@/components/common/StatusBadge'
import type { SummaryCardItem } from '@/components/common/SummaryCards'
import type { OrderStatus } from '@/types'
import type { PreparationPlanEntry } from '@/domain/preparation/planPreparation'
import { findItem, isBundleItem, isServiceItem, isStockItem } from '@/domain/master/itemRules'
import { findSupplier } from '@/domain/master/supplierRules'
import { findWarehouse } from '@/domain/master/warehouseRules'
import { documentTypeOf } from '@/domain/purchase/createIncomingDocument'
import {
  getRemainingQuantity,
  isInspectionPending,
  isUsableBy,
} from '@/domain/purchase/getRemainingQuantity'
// 입고예정 문서의 표시 문구는 발주 피처가 단일 출처다 — 주문 상세와 발주 현황이
// 같은 문서를 다른 이름으로 부르면 담당자가 두 화면을 잇지 못한다.
import { DOCUMENT_TYPE_LABEL } from '@/features/purchase/utils'
import { diffDays, formatDate, formatDueLabel } from '@/utils/date'
import { sumBy } from '@/utils/number'
import type {
  AssignedSerialRow,
  OrderStep,
  OrderStepKey,
  OrderStepState,
  OrderedItemRow,
  IncomingDocumentRow,
  PreparationFilter,
  PreparationItemRow,
  PreparationRow,
  PreparationStatusFilter,
} from './types'

/**
 * 도메인 상태 → 화면 표시.
 *
 * 도메인은 코드값만 안다. 한글 문구는 전부 이 파일에 모은다 — 문구를 고치는 일이
 * 판정 로직을 건드리지 않아야 하고, 테스트도 문구가 아니라 코드로 검증해야 한다.
 */
export const PREPARATION_STATUS: Record<PreparationStatus, StatusDescriptor> = {
  READY: { label: '바로 준비 가능', tone: 'success' },
  WAITING: { label: '입고 대기', tone: 'warning' },
  SHORTAGE: { label: '재고 부족', tone: 'danger' },
  EXCEPTION: { label: '확인 필요', tone: 'neutral' },
}

/**
 * 대기 사유별 배지 문구.
 *
 * 명세는 준비상태를 6종으로 보여주라고 한다 — 대기가 `품질검사 대기` · `생산 완료 대기` ·
 * `구매 입고 대기` 로 갈린다. 내부 코드는 WAITING 하나에 사유를 붙여 들고 있지만
 * (판정 로직에서 셋의 취급이 같다), **화면에 나가는 문구는 셋으로 갈라야 한다.**
 *
 * '입고 대기' 한 마디로 뭉치면 담당자가 언제 풀릴지 가늠할 수 없다. 검사만 남은 물량과
 * 아직 생산 중인 물량은 기다리는 시간이 다르다.
 */
const WAITING_STATUS: Record<PreparationWaitingReason, StatusDescriptor> = {
  QUALITY_INSPECTION: { label: '품질검사 대기', tone: 'warning' },
  PRODUCTION: { label: '생산 완료 대기', tone: 'warning' },
  PURCHASE: { label: '구매 입고 대기', tone: 'warning' },
}

/**
 * 한 주문의 대기 사유. 여러 품목이 서로 다른 것을 기다리면 **가장 오래 걸리는 단계**를
 * 대표로 보여준다 — 그 단계가 풀려야 주문이 나가기 때문이다.
 */
const WAITING_ORDER: PreparationWaitingReason[] = ['PRODUCTION', 'QUALITY_INSPECTION', 'PURCHASE']

export const slowestWaitingReason = (
  preparation: OrderPreparation,
): PreparationWaitingReason | undefined => {
  const reasons = new Set(
    preparation.items
      .map((item) => item.waitingReason)
      .filter((reason): reason is PreparationWaitingReason => reason !== undefined),
  )
  return WAITING_ORDER.find((reason) => reasons.has(reason))
}

/**
 * 준비상태 → 화면 배지.
 *
 * 대기 중이면 무엇을 기다리는지까지 배지에 담는다 (명세 21-1 준비상태 6종).
 */
export const statusDescriptorOf = (preparation: OrderPreparation): StatusDescriptor => {
  if (preparation.status !== 'WAITING') return PREPARATION_STATUS[preparation.status]

  const reason = slowestWaitingReason(preparation)
  return reason ? WAITING_STATUS[reason] : PREPARATION_STATUS.WAITING
}

export const WAITING_REASON: Record<PreparationWaitingReason, string> = {
  QUALITY_INSPECTION: '품질검사 대기',
  PRODUCTION: '생산 완료 대기',
  PURCHASE: '구매 입고 대기',
}

/**
 * 예약을 마친 주문. 준비상태는 READY 지만 담당자가 할 일이 다르다 —
 * 예약 버튼이 아니라 출고 버튼을 눌러야 한다. 같은 배지로 두면 목록에서 구분되지 않는다.
 */
export const RESERVED_STATUS: StatusDescriptor = { label: '예약 완료', tone: 'primary' }

/** 목록에 노출할 순서. '확인 필요' 는 담당자가 손을 대야 하므로 맨 뒤가 아니라 눈에 걸리게 둔다. */
export const STATUS_ORDER: PreparationStatus[] = ['READY', 'WAITING', 'SHORTAGE', 'EXCEPTION']

const itemNameOf = (items: readonly Item[], itemCode: string): string =>
  findItem(items, itemCode)?.itemName ?? itemCode

/** 이름을 나열하다 길어지면 자른다 — 표 한 줄이 두 줄로 늘어나면 목록을 훑기 어렵다 */
const joinNames = (names: readonly string[], limit = 2): string => {
  if (names.length === 0) return ''
  if (names.length <= limit) return names.join(', ')
  return `${names.slice(0, limit).join(', ')} 외 ${names.length - limit}건`
}

/**
 * 준비상태를 설명하는 한 줄.
 *
 * 상태 배지만으로는 다음 행동을 알 수 없다. '입고 대기' 는 기다리면 되고 '재고 부족' 은
 * 발주해야 하는데, 무엇을 기다리는지 · 무엇이 모자라는지가 있어야 판단할 수 있다.
 */
export const describePreparation = (
  preparation: OrderPreparation,
  items: readonly Item[],
  reserved = false,
): string => {
  if (reserved) return '재고 확보 완료 — 출고할 수 있습니다'

  if (preparation.status === 'EXCEPTION') {
    return preparation.blockingReasons[0]?.message ?? '데이터를 확인해야 합니다.'
  }

  if (preparation.status === 'SHORTAGE') {
    const names = preparation.items
      .filter((item) => item.shortageQuantity > 0)
      .map((item) => `${itemNameOf(items, item.itemCode)} ${item.shortageQuantity}개`)
    return `${joinNames(names)} 부족`
  }

  if (preparation.status === 'WAITING') {
    const reasons = [
      ...new Set(
        preparation.items
          .map((item) => item.waitingReason)
          .filter((reason): reason is PreparationWaitingReason => reason !== undefined)
          .map((reason) => WAITING_REASON[reason]),
      ),
    ]
    return reasons.join(', ')
  }

  return '가용재고로 전량 준비 가능'
}

export const toPreparationRow = (
  entry: PreparationPlanEntry,
  items: readonly Item[],
  warehouses: readonly Warehouse[],
  baseAt: ISODateString,
): PreparationRow => {
  const { order, preparation, priority, reserved } = entry
  const warehouse = findWarehouse(warehouses, order.warehouseCode)

  return {
    orderId: order.orderId,
    priority,

    deliveryDate: order.deliveryDate,
    deliveryLabel: formatDate(order.deliveryDate),
    dueLabel: formatDueLabel(order.deliveryDate, baseAt),
    overdue: diffDays(baseAt, order.deliveryDate) < 0,

    warehouseCode: order.warehouseCode,
    // 등록되지 않은 창고는 코드를 그대로 보여준다 — 이름이 없다고 행을 숨기면 놓친다
    warehouseName: warehouse?.warehouseName ?? order.warehouseCode,

    status: preparation.status,
    statusDescriptor: reserved ? RESERVED_STATUS : statusDescriptorOf(preparation),
    detail: describePreparation(preparation, items, reserved),
    reserved,

    itemCount: preparation.items.length,
    shortageQuantity: sumBy(preparation.items, (item) => item.shortageQuantity),
    excluded: entry.excluded,
    orderStatus: order.status,
  }
}

/**
 * 배송일별로 묶는다.
 *
 * 목록 순서가 이미 배송일 순이라 앞에서부터 훑으며 날짜가 바뀌는 자리에 머리를 넣으면
 * 된다. 다시 정렬하지 않는다 — 정렬을 한 번 더 하면 배정 순서와 목록 순서가 갈릴 수 있다.
 *
 * 담당자가 '오늘 몇 건' 을 눈으로 세지 않아도 되게 건수를 함께 적는다.
 */
export interface DeliveryGroup {
  deliveryDate: string
  label: string
  rows: PreparationRow[]
}

export const groupByDeliveryDate = (rows: readonly PreparationRow[]): DeliveryGroup[] => {
  const groups: DeliveryGroup[] = []

  for (const row of rows) {
    const last = groups.at(-1)
    if (last && last.deliveryDate === row.deliveryDate) {
      last.rows.push(row)
      continue
    }
    groups.push({ deliveryDate: row.deliveryDate, label: row.deliveryLabel, rows: [row] })
  }

  return groups
}

export const matchesFilter = (row: PreparationRow, filter: PreparationFilter): boolean => {
  if (filter.status !== 'ALL' && row.status !== filter.status) return false
  if (filter.warehouseCode !== 'ALL' && row.warehouseCode !== filter.warehouseCode) return false
  if (filter.deliveryDate !== 'ALL' && row.deliveryDate !== filter.deliveryDate) return false
  // 제외 주문은 기본으로 감춘다 — 새로 준비할 것이 없어 매일 보는 목록만 늘린다
  if (row.excluded && !filter.includeExcluded) return false
  if (filter.reserved === 'RESERVED' && !row.reserved) return false
  if (filter.reserved === 'UNRESERVED' && row.reserved) return false

  const keyword = filter.keyword.trim().toUpperCase()
  if (keyword && !row.orderId.toUpperCase().includes(keyword)) return false

  return true
}

/**
 * 요약 카드에서 표로 이어지는 선택.
 * 카드 하나가 필터 한 조합에 1:1 로 대응해야 담당자가 '이 숫자의 8건' 을 바로 볼 수 있다.
 */
export interface SummarySelection {
  status: PreparationStatusFilter
  reserved: PreparationFilter['reserved']
}

const sameSelection = (a: SummarySelection, b: SummarySelection): boolean =>
  a.status === b.status && a.reserved === b.reserved

/**
 * 요약 카드.
 *
 * 세는 대상은 필터 이전의 전체다. 필터를 걸 때마다 요약이 같이 움직이면 지금 걸린
 * 필터가 얼마나 걸러냈는지 알 수 없다.
 *
 * `selection` 을 넘기면 카드가 필터 버튼이 된다. 예약 완료를 '바로 준비 가능' 카드의
 * 힌트로 두지 않고 카드로 올린 이유도 이것이다 — 힌트는 누를 수 없다.
 */
export const toSummaryItems = (
  rows: readonly PreparationRow[],
  selection?: {
    current: SummarySelection
    onSelect: (next: SummarySelection) => void
  },
): SummaryCardItem[] => {
  const countOf = (status: PreparationStatus) => rows.filter((row) => row.status === status).length

  const overdue = rows.filter((row) => row.overdue).length
  const reserved = rows.filter((row) => row.reserved).length
  const readyUnreserved = rows.filter((row) => row.status === 'READY' && !row.reserved).length

  const card = (
    label: string,
    value: string,
    target: SummarySelection,
    extra: Partial<SummaryCardItem> = {},
  ): SummaryCardItem => ({
    label,
    value,

    ...extra,
    ...(selection
      ? {
          onSelect: () => selection.onSelect(target),
          selected: sameSelection(selection.current, target),
        }
      : {}),
  })

  return [
    card(
      '준비 대상 전체',
      `${rows.length}건`,
      { status: 'ALL', reserved: 'ALL' },
      {
        ...(overdue > 0
          ? { hint: `배송일 초과 ${overdue}건`, tone: 'danger' as const }
          : { hint: '배송일 순으로 배정합니다' }),
        action: '전체 보기',
      },
    ),
    card(
      '예약할 수 있음',
      `${readyUnreserved}건`,
      { status: 'READY', reserved: 'UNRESERVED' },
      {
        hint: '가용재고로 전량 준비됩니다',
        action: '예약할 주문 보기',
        tone: 'point' as const,
      },
    ),
    card(
      '출고할 수 있음',
      `${reserved}건`,
      { status: 'ALL', reserved: 'RESERVED' },
      {
        hint: '예약과 개체 배정이 끝났습니다',
        action: '출고할 주문 보기',
      },
    ),
    card(
      '입고 기다림',
      `${countOf('WAITING')}건`,
      { status: 'WAITING', reserved: 'ALL' },
      {
        hint: '걸려 있는 문서가 들어오면 풀립니다',
        action: '기다리는 주문 보기',
        tone: 'warning' as const,
      },
    ),
    card(
      '발주 필요',
      `${countOf('SHORTAGE')}건`,
      { status: 'SHORTAGE', reserved: 'ALL' },
      {
        hint: '입고예정까지 봐도 모자랍니다',
        action: '부족한 주문 보기',
        tone: 'danger' as const,
      },
    ),
    card(
      '사람이 볼 것',
      `${countOf('EXCEPTION')}건`,
      { status: 'EXCEPTION', reserved: 'ALL' },
      {
        hint: '데이터를 고쳐야 판정할 수 있습니다',
        action: '확인할 주문 보기',
      },
    ),
  ]
}

/**
 * 행 좌측 상태 레일의 색.
 *
 * 배지와 같은 톤을 쓴다. 예약 완료는 준비상태가 READY 지만 다음 행동이 다르므로
 * 배지와 마찬가지로 레일도 따로 구분한다.
 */
export const rowToneOf = (row: PreparationRow): RowTone =>
  row.reserved ? RESERVED_STATUS.tone : PREPARATION_STATUS[row.status].tone

/** 부족한 품목이 어떤 문서로 발주될지 — 버튼을 누르기 전에 알아야 한다 */
const issueNote = (item: Item | undefined): string => {
  if (!item) return '미등록 품목이라 발주할 수 없습니다'
  if (!isStockItem(item)) return `${item.itemType} 이라 발주 대상이 아닙니다`
  if (!item.defaultSupplierCode) return '기본공급처가 없어 발주할 수 없습니다'
  return `${DOCUMENT_TYPE_LABEL[documentTypeOf(item)]} 생성 대상`
}

/** 네 칸의 이름과 순서. 배열 순서가 곧 화면 순서다. */
const STEP_LABEL: Record<OrderStepKey, string> = {
  ISSUE: '부족분 발주',
  RECEIVE: '입고',
  RESERVE: '예약',
  SHIP: '출고',
}

const STEP_HINT: Record<OrderStepKey, string> = {
  ISSUE: '부족한 품목을 구매발주 · 생산의뢰로 냅니다. 문서를 만들어도 현재고는 늘지 않습니다.',
  RECEIVE: '걸려 있는 문서가 입고되면 재고가 늘고 이 주문이 다시 판정됩니다.',
  RESERVE: '재고와 개체를 이 주문에 묶습니다. 전량 아니면 전무입니다.',
  SHIP: '현재고와 예약수량을 함께 줄이고 개체를 창고에서 내보냅니다.',
}

const STEP_ORDER: OrderStepKey[] = ['ISSUE', 'RECEIVE', 'RESERVE', 'SHIP']

/**
 * 한 주문이 지금 네 칸 중 어디에 있는가.
 *
 * 판정을 다시 하지 않는다. 이미 나온 준비상태 · 예약 여부 · 주문상태 셋을 읽어 칸의
 * 상태로 옮기기만 한다 — 여기서 다시 판단하면 배지와 단계가 서로 다른 말을 하게 된다.
 *
 * 재고로 바로 채워지는 주문의 발주 · 입고 칸은 TODO 가 아니라 SKIPPED 다. 할 일이
 * 남은 것처럼 보이면 담당자가 발주를 찾는다.
 */
export const toOrderSteps = (
  preparation: OrderPreparation,
  reserved: boolean,
  orderStatus: OrderStatus,
): OrderStep[] => {
  const shipped = orderStatus === '출고 완료' || orderStatus === '배송 완료'

  const stateOf = (key: OrderStepKey): OrderStepState => {
    if (preparation.status === 'EXCEPTION') return 'BLOCKED'

    switch (key) {
      case 'ISSUE':
        return preparation.status === 'SHORTAGE' ? 'CURRENT' : 'SKIPPED'
      case 'RECEIVE':
        if (preparation.status === 'SHORTAGE') return 'TODO'
        return preparation.status === 'WAITING' ? 'CURRENT' : 'SKIPPED'
      case 'RESERVE':
        if (shipped || reserved) return 'DONE'
        return preparation.status === 'READY' ? 'CURRENT' : 'TODO'
      case 'SHIP':
        if (shipped) return 'DONE'
        return reserved ? 'CURRENT' : 'TODO'
    }
  }

  return STEP_ORDER.map((key) => {
    const state = stateOf(key)

    return {
      key,
      label: STEP_LABEL[key],
      state,
      ...(state === 'CURRENT' ? { hint: STEP_HINT[key] } : {}),
    }
  })
}

/** 지금 할 일. 없으면(출고 완료·확인 필요) null */
export const currentStep = (steps: readonly OrderStep[]): OrderStep | undefined =>
  steps.find((step) => step.state === 'CURRENT')

/**
 * 06_주문에 적힌 그대로의 품목 목록.
 *
 * 판정하지 않는다. 각 줄이 준비 수요로 어떻게 옮겨졌는지 한 줄로 적기만 한다 —
 * 세트는 무엇으로 풀렸고, 취소·서비스는 왜 빠졌는지.
 */
export const toOrderedItemRows = (
  order: Order,
  items: readonly Item[],
  bundleComponents: readonly BundleComponent[],
): OrderedItemRow[] => {
  return order.items.map((line) => {
    const master = findItem(items, line.itemCode)

    const describe = (): { note: string; excluded: boolean } => {
      if (line.status === '취소') {
        return { note: '취소된 품목이라 준비 수량에서 제외합니다', excluded: true }
      }
      if (!master) {
        return { note: '01_품목에 없는 품목코드입니다 — 확인이 필요합니다', excluded: true }
      }
      if (isServiceItem(master)) {
        return { note: '재고로 관리하지 않는 항목이라 준비 수량에서 제외합니다', excluded: true }
      }
      if (isBundleItem(master)) {
        const components = bundleComponents.filter(
          (component) => component.bundleItemCode === line.itemCode,
        )
        if (components.length === 0) {
          return { note: '02_세트구성에 구성품이 없습니다 — 확인이 필요합니다', excluded: true }
        }

        const expanded = components
          .filter((component) => component.isOutboundTarget)
          .map((component) => {
            const name =
              findItem(items, component.componentItemCode)?.itemName ?? component.componentItemCode
            return `${name} ${component.quantity * line.quantity}개`
          })

        return { note: `세트 전개 → ${expanded.join(', ')}`, excluded: false }
      }
      return { note: '그대로 준비 품목이 됩니다', excluded: false }
    }

    const { note, excluded } = describe()

    return {
      sequence: line.sequence,
      itemCode: line.itemCode,
      itemName: master?.itemName ?? line.itemCode,
      itemType: master?.itemType ?? '-',
      quantity: line.quantity,
      status: line.status,
      note,
      excluded,
    }
  })
}

export const toItemRows = (
  preparation: OrderPreparation,
  items: readonly Item[],
): PreparationItemRow[] => {
  return preparation.items.map((line) => {
    const master = findItem(items, line.itemCode)

    const note =
      line.status === 'WAITING'
        ? line.waitingReason
          ? WAITING_REASON[line.waitingReason]
          : ''
        : line.status === 'SHORTAGE'
          ? issueNote(master)
          : ''

    return {
      itemCode: line.itemCode,
      itemName: master?.itemName ?? line.itemCode,
      itemType: master?.itemType ?? '-',

      requiredQuantity: line.requiredQuantity,
      availableQuantity: line.availableQuantity,
      incomingQuantity: line.incomingQuantity,
      shortageQuantity: line.shortageQuantity,

      status: line.status,
      statusDescriptor:
        line.status === 'WAITING' && line.waitingReason
          ? WAITING_STATUS[line.waitingReason]
          : PREPARATION_STATUS[line.status],
      note,
      incomingDocumentIds: line.incomingDocumentIds,
    }
  })
}

export const toSerialRows = (
  serials: readonly SerialInventory[],
  items: readonly Item[],
  orderId: string,
): AssignedSerialRow[] => {
  return serials
    .filter((serial) => serial.reservedOrderId === orderId)
    .map((serial) => ({
      serialNumber: serial.serialNumber,
      itemCode: serial.itemCode,
      itemName: findItem(items, serial.itemCode)?.itemName ?? serial.itemCode,
      location: serial.location,
      status: serial.status,
    }))
}

export const toIncomingRow = (
  document: IncomingDocument,
  items: readonly Item[],
  suppliers: readonly Supplier[],
  deliveryDate: ISODateString,
): IncomingDocumentRow => {
  const remainingQuantity = getRemainingQuantity(document)

  return {
    documentId: document.documentId,
    typeLabel: DOCUMENT_TYPE_LABEL[document.documentType],

    itemCode: document.itemCode,
    itemName: findItem(items, document.itemCode)?.itemName ?? document.itemCode,
    supplierName:
      findSupplier(suppliers, document.supplierCode)?.supplierName ?? document.supplierCode,

    plannedQuantity: document.plannedQuantity,
    receivedQuantity: document.receivedQuantity,
    remainingQuantity,

    availableLabel: formatDate(document.availableDate),
    usable: isUsableBy(document, deliveryDate),

    progressStatus: document.status,
    inspectionStatus: document.inspectionStatus,

    canInspect: isInspectionPending(document),
    canReceive: document.confirmed && !isInspectionPending(document) && remainingQuantity > 0,
  }
}

export const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: '전체 상태' },
  ...STATUS_ORDER.map((status) => ({ value: status, label: PREPARATION_STATUS[status].label })),
]

/**
 * 배송일 필터 옵션 — 계획에 실제로 있는 날짜만 세운다.
 *
 * 달력을 두지 않는 이유: 주문이 없는 날을 고를 수 있으면 빈 목록이 필터 탓인지 데이터
 * 탓인지 알 수 없다. 계획은 이미 배송일 순서라 순서를 다시 만들지 않는다.
 */
export const deliveryDateFilterOptions = (rows: readonly PreparationRow[]) => [
  { value: 'ALL', label: '전체 배송일' },
  ...[...new Set(rows.map((row) => row.deliveryDate))].map((deliveryDate) => ({
    value: deliveryDate,
    label: formatDate(deliveryDate),
  })),
]

export const warehouseFilterOptions = (warehouses: readonly Warehouse[]) => [
  { value: 'ALL', label: '전체 창고' },
  ...warehouses.map((warehouse) => ({
    value: warehouse.warehouseCode,
    label: warehouse.warehouseName,
  })),
]
