import type {
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
import type { PreparationPlanEntry } from '@/domain/preparation/planPreparation'
import { findItem, isStockItem } from '@/domain/master/itemRules'
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
export function describePreparation(
  preparation: OrderPreparation,
  items: readonly Item[],
  reserved = false,
): string {
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

export function toPreparationRow(
  entry: PreparationPlanEntry,
  items: readonly Item[],
  warehouses: readonly Warehouse[],
  baseAt: ISODateString,
): PreparationRow {
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
    statusDescriptor: reserved ? RESERVED_STATUS : PREPARATION_STATUS[preparation.status],
    detail: describePreparation(preparation, items, reserved),
    reserved,

    itemCount: preparation.items.length,
    shortageQuantity: sumBy(preparation.items, (item) => item.shortageQuantity),
  }
}

export const matchesFilter = (row: PreparationRow, filter: PreparationFilter): boolean => {
  if (filter.status !== 'ALL' && row.status !== filter.status) return false
  if (filter.warehouseCode !== 'ALL' && row.warehouseCode !== filter.warehouseCode) return false
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
export function toSummaryItems(
  rows: readonly PreparationRow[],
  selection?: {
    current: SummarySelection
    onSelect: (next: SummarySelection) => void
  },
): SummaryCardItem[] {
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
      '준비 대상',
      `${rows.length}건`,
      { status: 'ALL', reserved: 'ALL' },
      overdue > 0 ? { hint: `배송일 초과 ${overdue}건`, tone: 'danger' as const } : {},
    ),
    card(
      '바로 준비 가능',
      `${readyUnreserved}건`,
      { status: 'READY', reserved: 'UNRESERVED' },
      {
        hint: '예약할 수 있습니다',
      },
    ),
    card(
      '예약 완료',
      `${reserved}건`,
      { status: 'ALL', reserved: 'RESERVED' },
      {
        hint: '출고할 수 있습니다',
      },
    ),
    card(
      '입고 대기',
      `${countOf('WAITING')}건`,
      { status: 'WAITING', reserved: 'ALL' },
      {
        tone: 'warning' as const,
      },
    ),
    card(
      '재고 부족',
      `${countOf('SHORTAGE')}건`,
      { status: 'SHORTAGE', reserved: 'ALL' },
      {
        hint: '발주가 필요합니다',
        tone: 'danger' as const,
      },
    ),
    card('확인 필요', `${countOf('EXCEPTION')}건`, { status: 'EXCEPTION', reserved: 'ALL' }),
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

export function toItemRows(
  preparation: OrderPreparation,
  items: readonly Item[],
): PreparationItemRow[] {
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
      statusDescriptor: PREPARATION_STATUS[line.status],
      note,
      incomingDocumentIds: line.incomingDocumentIds,
    }
  })
}

export function toSerialRows(
  serials: readonly SerialInventory[],
  items: readonly Item[],
  orderId: string,
): AssignedSerialRow[] {
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

export function toIncomingRow(
  document: IncomingDocument,
  items: readonly Item[],
  suppliers: readonly Supplier[],
  deliveryDate: ISODateString,
): IncomingDocumentRow {
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

export const warehouseFilterOptions = (warehouses: readonly Warehouse[]) => [
  { value: 'ALL', label: '전체 창고' },
  ...warehouses.map((warehouse) => ({
    value: warehouse.warehouseCode,
    label: warehouse.warehouseName,
  })),
]
