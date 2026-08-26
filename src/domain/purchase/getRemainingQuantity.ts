import type {
  DocumentId,
  ErpDatabase,
  ISODateString,
  IncomingDocument,
  ItemCode,
  PreparationWaitingReason,
  Quantity,
  WarehouseCode,
} from '@/types'
import { compareIso, diffDays } from '@/utils/date'

/**
 * 앞으로 들어올 수량 = 계획수량 - 입고수량 (00_안내).
 * 부분 입고된 수량은 이미 현재고에 반영돼 있으므로 두 번 세지 않는다.
 */
export const getRemainingQuantity = (document: IncomingDocument): Quantity =>
  Math.max(0, document.plannedQuantity - document.receivedQuantity)

/**
 * 입고예정으로 셀 수 있는 문서인가.
 *
 * 확정되지 않은 '작성 중' 문서는 제외한다 — 아직 공급처에 나가지 않은 계획이라
 * 도착을 기대할 수 없다. (PO-20260721-PIL, PO-20260721-FRMK)
 */
export const isIncomingPlanned = (document: IncomingDocument): boolean =>
  document.confirmed && getRemainingQuantity(document) > 0

/** 검사가 끝나지 않은 수량은 아직 현재고가 될 수 없다 (00_안내) */
export const isInspectionPending = (document: IncomingDocument): boolean =>
  document.inspectionStatus === '검사 대기' || document.inspectionStatus === '검사 전'

/**
 * 이 배송일을 맞출 수 있는 물량인가.
 *
 * 배송일 당일 도착은 세지 않는다. 입고 검수·적치를 거쳐야 피킹할 수 있으므로
 * 배송일 전날까지 들어와야 실제로 쓸 수 있다.
 *
 * 이 조건이 빠지면 배송일이 지난 뒤 도착하는 발주까지 WAITING 근거로 잡혀,
 * 사실은 못 맞추는 주문이 '입고 대기' 로 보인다. SHORTAGE 로 잡혀 발주가 나가야 할
 * 주문이 조용히 묻히는 쪽이 더 위험하다.
 */
export const isUsableBy = (document: IncomingDocument, deliveryDate: ISODateString): boolean =>
  diffDays(document.availableDate, deliveryDate) >= 1

export type IncomingContext = Pick<ErpDatabase, 'incomingDocuments'>

/**
 * 특정 품목 × 창고로 들어올 예정인 문서들. 도착이 빠른 순서로 준다.
 *
 * `deliveryDate` 를 주면 그 배송일을 맞출 수 있는 문서만 남긴다. 생략하면 확정된
 * 입고예정 전체 — 특정 주문과 무관하게 '앞으로 들어올 물량' 을 볼 때 쓴다.
 */
export function findIncomingDocuments(
  ctx: IncomingContext,
  itemCode: ItemCode,
  warehouseCode: WarehouseCode,
  deliveryDate?: ISODateString,
): IncomingDocument[] {
  return ctx.incomingDocuments
    .filter(
      (document) =>
        document.itemCode === itemCode &&
        document.warehouseCode === warehouseCode &&
        isIncomingPlanned(document) &&
        (deliveryDate === undefined || isUsableBy(document, deliveryDate)),
    )
    .sort((a, b) => compareIso(a.availableDate, b.availableDate))
}

export function calculateIncomingQuantity(
  ctx: IncomingContext,
  itemCode: ItemCode,
  warehouseCode: WarehouseCode,
  deliveryDate?: ISODateString,
): Quantity {
  return findIncomingDocuments(ctx, itemCode, warehouseCode, deliveryDate).reduce(
    (acc, document) => acc + getRemainingQuantity(document),
    0,
  )
}

/**
 * 무엇을 기다리는지 한 가지로 요약한다.
 * 여러 문서가 걸려 있으면 가장 먼저 도착하는 문서를 기준으로 잡는다 — 대기가 풀리는 시점이다.
 */
export function resolveWaitingReason(
  documents: readonly IncomingDocument[],
): PreparationWaitingReason | undefined {
  const first = documents[0]
  if (!first) return undefined
  if (first.documentType === '구매') return 'PURCHASE'
  return first.inspectionStatus === '검사 대기' ? 'QUALITY_INSPECTION' : 'PRODUCTION'
}

export const documentIdsOf = (documents: readonly IncomingDocument[]): DocumentId[] =>
  documents.map((document) => document.documentId)
