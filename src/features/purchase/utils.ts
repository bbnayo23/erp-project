import type {
  ISODateString,
  IncomingDocument,
  IncomingDocumentType,
  Item,
  Supplier,
  Warehouse,
} from '@/types'
import type { RowTone } from '@/components/common/DataTable'
import type { StatusDescriptor } from '@/components/common/StatusBadge'
import type { SummaryCardItem } from '@/components/common/SummaryCards'
import { findItem } from '@/domain/master/itemRules'
import { findSupplier } from '@/domain/master/supplierRules'
import { findWarehouse } from '@/domain/master/warehouseRules'
import { getRemainingQuantity, isInspectionPending } from '@/domain/purchase/getRemainingQuantity'
import { compareIso, diffDays, formatDate } from '@/utils/date'
import { sumBy } from '@/utils/number'
import type { IncomingRow, PurchaseFilter, PurchaseStage, PurchaseStageFilter } from './types'

/**
 * 입고예정 문서 → 화면 표시.
 *
 * 도메인은 문서의 숫자와 상태만 안다. 한글 문구와 단계 판정은 전부 이 파일에 모은다 —
 * features/preparation/utils 와 같은 원칙이다. 문구를 고치는 일이 재고 로직을 건드리면
 * 안 되고, 테스트도 문구가 아니라 코드로 검증해야 한다.
 */

/** 문서구분 → 화면 문구. 07_입고예정은 '구매'/'생산' 이지만 담당자는 발주서 이름으로 부른다. */
export const DOCUMENT_TYPE_LABEL: Record<IncomingDocumentType, string> = {
  구매: '구매발주',
  생산: '생산의뢰',
}

export const PURCHASE_STAGE: Record<PurchaseStage, StatusDescriptor> = {
  DRAFT: { label: '미확정', tone: 'neutral' },
  INSPECT: { label: '검사 대기', tone: 'warning' },
  ARRIVED: { label: '입고 대기', tone: 'primary' },
  SCHEDULED: { label: '도착 예정', tone: 'info' },
  DONE: { label: '입고 완료', tone: 'success' },
}

/**
 * 목록에 늘어놓을 순서. 지금 눌러야 하는 것이 위로 온다.
 *
 * 필터 옵션의 순서이자 표의 정렬 기준이다 — 둘이 갈리면 필터를 걸었을 때 행이
 * 어디로 갔는지 알 수 없다.
 */
export const STAGE_ORDER: PurchaseStage[] = ['INSPECT', 'ARRIVED', 'SCHEDULED', 'DRAFT', 'DONE']

/**
 * 문서가 어느 단계에 있는가.
 *
 * 순서가 곧 판정이다. 잔여가 없으면 그 뒤 조건은 볼 것이 없고, 확정되지 않은 문서는
 * 검사도 입고도 시작할 수 없다.
 */
export function stageOf(document: IncomingDocument, baseAt: ISODateString): PurchaseStage {
  if (getRemainingQuantity(document) === 0) return 'DONE'
  if (!document.confirmed) return 'DRAFT'
  if (isInspectionPending(document)) return 'INSPECT'
  return diffDays(baseAt, document.availableDate) > 0 ? 'SCHEDULED' : 'ARRIVED'
}

/**
 * 기준시각 대비 도착 시점.
 *
 * formatDueLabel 을 쓰지 않는다. 저쪽의 '2일 초과' 는 배송 납기를 넘겼다는 뜻이지만
 * 같은 문장이 여기서는 물건이 늦게 들어오고 있다는 뜻이다 — 담당자가 읽는 사건이 다르다.
 */
export function arrivalLabel(document: IncomingDocument, baseAt: ISODateString): string {
  if (getRemainingQuantity(document) === 0) return '입고 완료'

  const days = diffDays(baseAt, document.availableDate)
  if (days === 0) return '오늘 도착'
  if (days > 0) return `${days}일 뒤 도착`
  return `${Math.abs(days)}일 지연`
}

/** 이 단계에서 담당자가 할 일. 배지만으로는 다음 행동을 알 수 없다. */
function describeStage(stage: PurchaseStage, document: IncomingDocument): string {
  switch (stage) {
    case 'DRAFT':
      return '확정되지 않아 입고예정으로 세지 않습니다'
    case 'INSPECT':
      return `검사 ${document.inspectionStatus} — 통과해야 현재고에 반영됩니다`
    case 'ARRIVED':
      return `잔여 ${getRemainingQuantity(document)}개를 입고할 수 있습니다`
    case 'SCHEDULED':
      return '아직 도착하지 않았습니다'
    case 'DONE':
      return '계획수량을 모두 입고했습니다'
  }
}

export function toIncomingRow(
  document: IncomingDocument,
  items: readonly Item[],
  warehouses: readonly Warehouse[],
  suppliers: readonly Supplier[],
  baseAt: ISODateString,
): IncomingRow {
  const remainingQuantity = getRemainingQuantity(document)
  const stage = stageOf(document, baseAt)
  const warehouse = findWarehouse(warehouses, document.warehouseCode)

  return {
    documentId: document.documentId,
    documentType: document.documentType,
    typeLabel: DOCUMENT_TYPE_LABEL[document.documentType],

    itemCode: document.itemCode,
    // 등록되지 않은 품목은 코드를 그대로 보여준다 — 이름이 없다고 행을 숨기면 놓친다
    itemName: findItem(items, document.itemCode)?.itemName ?? document.itemCode,

    warehouseCode: document.warehouseCode,
    warehouseName: warehouse?.warehouseName ?? document.warehouseCode,

    supplierName:
      findSupplier(suppliers, document.supplierCode)?.supplierName ?? document.supplierCode,

    plannedQuantity: document.plannedQuantity,
    receivedQuantity: document.receivedQuantity,
    remainingQuantity,

    availableDate: document.availableDate,
    availableLabel: formatDate(document.availableDate),
    arrivalLabel: arrivalLabel(document, baseAt),
    overdue: remainingQuantity > 0 && diffDays(baseAt, document.availableDate) < 0,

    progressStatus: document.status,
    inspectionStatus: document.inspectionStatus,
    confirmed: document.confirmed,

    stage,
    stageDescriptor: PURCHASE_STAGE[stage],
    detail: describeStage(stage, document),

    // 미확정 문서에는 버튼을 내지 않는다. 스토어의 inspect 는 확정 여부를 보지 않지만,
    // 확정 전에 검사부터 통과시키면 '미확정인데 검사 완료' 라는 설명할 수 없는 문서가 남는다.
    canConfirm: !document.confirmed,
    canInspect: document.confirmed && isInspectionPending(document),
    canReceive: document.confirmed && !isInspectionPending(document) && remainingQuantity > 0,

    ...(document.relatedOrderId ? { relatedOrderId: document.relatedOrderId } : {}),
  }
}

/**
 * 처리할 것부터 위로.
 *
 * 배송 준비 현황과 달리 여기서는 정렬해도 잃는 것이 없다. 저쪽의 목록 순서는 재고를
 * 배정받은 순서라 건드릴 수 없지만, 입고예정 문서에는 그런 순서가 없다.
 */
export const compareRows = (a: IncomingRow, b: IncomingRow): number =>
  STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) ||
  compareIso(a.availableDate, b.availableDate) ||
  a.documentId.localeCompare(b.documentId)

export const matchesFilter = (row: IncomingRow, filter: PurchaseFilter): boolean => {
  if (filter.stage !== 'ALL' && row.stage !== filter.stage) return false
  if (filter.documentType !== 'ALL' && row.documentType !== filter.documentType) return false
  if (filter.warehouseCode !== 'ALL' && row.warehouseCode !== filter.warehouseCode) return false

  const keyword = filter.keyword.trim().toUpperCase()
  if (!keyword) return true

  // 문서번호로도 품목으로도 찾는다 — 담당자는 공급처 메일의 문서번호를 들고 오기도 하고
  // '베개가 언제 들어오지' 를 들고 오기도 한다
  return (
    row.documentId.toUpperCase().includes(keyword) ||
    row.itemCode.toUpperCase().includes(keyword) ||
    row.itemName.toUpperCase().includes(keyword)
  )
}

/**
 * 행 좌측 상태 레일의 색 — 배지와 같은 톤을 쓴다.
 * 도착이 지연된 문서는 단계와 무관하게 붉게 세운다. 지연은 단계가 말해 주지 않는다.
 */
export const rowToneOf = (row: IncomingRow): RowTone =>
  row.overdue ? 'danger' : PURCHASE_STAGE[row.stage].tone

/**
 * 요약 카드.
 *
 * 세는 대상은 필터 이전의 전체다. 필터를 걸 때마다 요약이 같이 움직이면 지금 걸린
 * 필터가 얼마나 걸러냈는지 알 수 없다.
 *
 * `selection` 을 넘기면 카드가 필터 버튼이 된다 — '검사 대기 4건' 을 보고 그 4건을
 * 보려면 아래 셀렉트를 다시 찾는 게 아니라 방금 본 숫자를 누르면 된다.
 */
export function toSummaryItems(
  rows: readonly IncomingRow[],
  selection?: {
    current: PurchaseStageFilter
    onSelect: (next: PurchaseStageFilter) => void
  },
): SummaryCardItem[] {
  const countOf = (stage: PurchaseStage) => rows.filter((row) => row.stage === stage).length

  const overdue = rows.filter((row) => row.overdue).length
  const arrivedQuantity = sumBy(
    rows.filter((row) => row.stage === 'ARRIVED'),
    (row) => row.remainingQuantity,
  )

  const card = (
    label: string,
    value: string,
    target: PurchaseStageFilter,
    extra: Partial<SummaryCardItem> = {},
  ): SummaryCardItem => ({
    label,
    value,

    ...extra,
    ...(selection
      ? {
          onSelect: () => selection.onSelect(target),
          selected: selection.current === target,
        }
      : {}),
  })

  return [
    card('입고예정 문서 전체', `${rows.length}건`, 'ALL', {
      // 지연이 있으면 잔여 합계보다 그쪽이 먼저 눈에 걸려야 한다
      ...(overdue > 0
        ? { hint: `도착 지연 ${overdue}건`, tone: 'danger' as const }
        : { hint: `잔여 ${sumBy(rows, (row) => row.remainingQuantity)}개` }),
      action: '전체 보기',
    }),
    card('검사할 것', `${countOf('INSPECT')}건`, 'INSPECT', {
      hint: '통과시켜야 입고할 수 있습니다',
      action: '검사할 문서 보기',
      tone: 'warning' as const,
    }),
    card('입고할 것', `${countOf('ARRIVED')}건`, 'ARRIVED', {
      // 지금 손대야 하는 단계 — 화면에서 포인트 색을 받는 유일한 지표다
      ...(arrivedQuantity > 0 ? { hint: `잔여 ${arrivedQuantity}개` } : { hint: '도착했습니다' }),
      action: '입고할 문서 보기',
      tone: 'point' as const,
    }),
    card('기다리는 것', `${countOf('SCHEDULED')}건`, 'SCHEDULED', {
      hint: '아직 도착하지 않았습니다',
      action: '도착 예정 보기',
    }),
    card('확정 안 됨', `${countOf('DRAFT')}건`, 'DRAFT', {
      hint: '판정에 쓰이지 않습니다',
      action: '미확정 문서 보기',
    }),
    card('끝난 것', `${countOf('DONE')}건`, 'DONE', {
      hint: '계획수량을 전량 입고했습니다',
      action: '입고 완료 보기',
    }),
  ]
}

export const STAGE_FILTER_OPTIONS = [
  { value: 'ALL', label: '전체 단계' },
  ...STAGE_ORDER.map((stage) => ({ value: stage, label: PURCHASE_STAGE[stage].label })),
]

export const DOCUMENT_TYPE_FILTER_OPTIONS = [
  { value: 'ALL', label: '전체 구분' },
  ...(['구매', '생산'] as const).map((type) => ({
    value: type,
    label: DOCUMENT_TYPE_LABEL[type],
  })),
]

/**
 * 입고창고 필터.
 *
 * 사용 중지 창고도 남긴다. 그 창고로 들어오는 문서가 있다면 그것 자체가 담당자가 봐야
 * 하는 사건이고, 옵션에서 지우면 문서를 찾을 길이 없어진다.
 */
export const warehouseFilterOptions = (warehouses: readonly Warehouse[]) => [
  { value: 'ALL', label: '전체 창고' },
  ...warehouses.map((warehouse) => ({
    value: warehouse.warehouseCode,
    label: warehouse.warehouseName,
  })),
]
