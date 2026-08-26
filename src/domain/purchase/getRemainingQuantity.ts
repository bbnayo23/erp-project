import type {
  DocumentId,
  ErpDatabase,
  IncomingDocument,
  ItemCode,
  PreparationWaitingReason,
  Quantity,
  WarehouseCode,
} from '@/types'
import { compareIso } from '@/utils/date'

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

export type IncomingContext = Pick<ErpDatabase, 'incomingDocuments'>

/** 특정 품목 × 창고로 들어올 예정인 문서들. 도착이 빠른 순서로 준다. */
export function findIncomingDocuments(
  ctx: IncomingContext,
  itemCode: ItemCode,
  warehouseCode: WarehouseCode,
): IncomingDocument[] {
  return ctx.incomingDocuments
    .filter(
      (document) =>
        document.itemCode === itemCode &&
        document.warehouseCode === warehouseCode &&
        isIncomingPlanned(document),
    )
    .sort((a, b) => compareIso(a.availableDate, b.availableDate))
}

export function calculateIncomingQuantity(
  ctx: IncomingContext,
  itemCode: ItemCode,
  warehouseCode: WarehouseCode,
): Quantity {
  return findIncomingDocuments(ctx, itemCode, warehouseCode).reduce(
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
