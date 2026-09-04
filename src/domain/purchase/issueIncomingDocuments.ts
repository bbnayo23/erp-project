import type {
  DocumentId,
  ErpDatabase,
  ISODateString,
  IncomingDocument,
  IncomingDocumentType,
  ItemCode,
  WarehouseCode,
} from '@/types'
import { findItem, isStockItem } from '@/domain/master/itemRules'
import { findSupplier } from '@/domain/master/supplierRules'
import { findWarehouse, isActiveWarehouse } from '@/domain/master/warehouseRules'
import { DUPLICATE_REQUEST, isProcessed, markProcessed } from '@/domain/request/idempotency'
import { createIncomingDocument, documentTypeOf } from './createIncomingDocument'
import type { ShortageLine } from './calculateShortage'

export type IssueIncomingContext = Pick<
  ErpDatabase,
  'items' | 'warehouses' | 'suppliers' | 'incomingDocuments' | 'processedRequests'
>

export type IssueRejectionCode =
  /** 01_품목에 없는 품목코드 */
  | 'UNKNOWN_ITEM'
  /** 서비스와 세트상품 자체는 발주 대상이 아니다 — 세트는 구성품으로 이미 풀려 있다 */
  | 'NOT_ORDERABLE'
  /** 08_공급처에 기본공급처가 없거나 등록되지 않았다 */
  | 'MISSING_SUPPLIER'
  | 'UNKNOWN_WAREHOUSE'
  /** 사용 중지된 창고로는 발주할 수 없다 */
  | 'INACTIVE_WAREHOUSE'

export interface IssueRejection {
  itemCode: ItemCode
  warehouseCode: WarehouseCode
  code: IssueRejectionCode
  /** 화면에 그대로 띄울 수 있는 문구 */
  message: string
}

export interface IssueIncomingInput {
  lines: readonly ShortageLine[]
  /** 발주 요청 ID — 같은 값으로 두 번 요청해도 문서는 한 번만 만들어진다 */
  requestId: string
  /** 발주 기준 시각. 사용가능예정일을 리드타임으로 계산한다. */
  orderedAt: ISODateString
  /**
   * 문서번호 생성기. 호출부가 넘기는 이유는 순수성이다 — 같은 입력에 같은 문서가
   * 나와야 테스트가 결정적이고, 되돌려 만든 결과를 비교할 수 있다.
   */
  makeDocumentId: (
    line: ShortageLine,
    documentType: IncomingDocumentType,
    index: number,
  ) => DocumentId
}

export interface IssueIncomingResult {
  ok: boolean
  failure?: typeof DUPLICATE_REQUEST
  /** 새로 만든 문서들 */
  created: IncomingDocument[]
  /** 기존 문서에 새 문서를 붙인 전체 목록 — 호출부가 그대로 대입한다 */
  incomingDocuments: ErpDatabase['incomingDocuments']
  processedRequests: ErpDatabase['processedRequests']
  /** 발주하지 못한 부족분과 그 이유. 조용히 버리면 부족한 채로 잊힌다. */
  rejections: IssueRejection[]
}

/**
 * 부족분을 발주·생산의뢰 문서로 만든다 (가이드 §14, §15).
 *
 * 매입품은 구매발주(PO), 생산품은 생산의뢰(MO) 로 갈린다 — createIncomingDocument 가
 * 품목유형을 보고 정한다. 입고창고는 주문의 출고창고와 같아야 한다. 다른 창고로 받으면
 * 그 주문은 여전히 물건을 못 쓴다. 그래서 창고를 고르지 않고 부족분에 적힌 창고를 쓴다.
 *
 * 문서를 만든 것만으로 현재고는 늘지 않는다 (00_안내). 여기서 만드는 것은 계획이고
 * 현재고는 receiveIncoming 이 처리한다.
 *
 * 만들 수 없는 부족분은 rejections 로 남긴다. 발주 대상이 아닌 품목이나 공급처 누락은
 * 임의로 대체하지 않는다 (§19) — 담당자가 알아야 하는 사건이다.
 */
export const issueIncomingDocuments = (
  ctx: IssueIncomingContext,
  { lines, requestId, orderedAt, makeDocumentId }: IssueIncomingInput,
): IssueIncomingResult => {
  if (isProcessed(ctx.processedRequests, requestId)) {
    return {
      ok: false,
      failure: DUPLICATE_REQUEST,
      created: [],
      incomingDocuments: ctx.incomingDocuments,
      processedRequests: ctx.processedRequests,
      rejections: [],
    }
  }

  const created: IncomingDocument[] = []
  const rejections: IssueRejection[] = []

  const reject = (line: ShortageLine, code: IssueRejectionCode, message: string): void => {
    rejections.push({
      itemCode: line.itemCode,
      warehouseCode: line.warehouseCode,
      code,
      message,
    })
  }

  for (const line of lines) {
    // 부족수량이 0 이하면 새 발주를 만들지 않는다 (§14.1). 거부도 아니다 — 필요가 없다.
    if (line.shortageQuantity <= 0) continue

    const item = findItem(ctx.items, line.itemCode)
    if (!item) {
      reject(line, 'UNKNOWN_ITEM', `품목코드 ${line.itemCode} 이(가) 등록되지 않았습니다.`)
      continue
    }
    if (!isStockItem(item)) {
      reject(
        line,
        'NOT_ORDERABLE',
        `${item.itemName} 은(는) ${item.itemType} 이라 발주 대상이 아닙니다.`,
      )
      continue
    }

    const warehouse = findWarehouse(ctx.warehouses, line.warehouseCode)
    if (!warehouse) {
      reject(line, 'UNKNOWN_WAREHOUSE', `등록되지 않은 입고창고입니다. (${line.warehouseCode})`)
      continue
    }
    if (!isActiveWarehouse(warehouse)) {
      reject(
        line,
        'INACTIVE_WAREHOUSE',
        `${warehouse.warehouseName} 은(는) 사용 중지된 창고라 입고받을 수 없습니다.`,
      )
      continue
    }

    const supplier = item.defaultSupplierCode
      ? findSupplier(ctx.suppliers, item.defaultSupplierCode)
      : undefined
    if (!supplier) {
      reject(line, 'MISSING_SUPPLIER', `${item.itemName} 의 기본공급처가 없습니다.`)
      continue
    }

    created.push(
      createIncomingDocument({
        documentId: makeDocumentId(line, documentTypeOf(item), created.length),
        item,
        supplier,
        warehouseCode: line.warehouseCode,
        quantity: line.shortageQuantity,
        orderedAt,
        // 부족분에 걸린 주문 중 가장 급한 건 — 계획이 배송일 순서라 첫 번째가 그것이다
        ...(line.orderIds[0] ? { relatedOrderId: line.orderIds[0] } : {}),
      }),
    )
  }

  // 만든 문서가 없으면 요청을 처리한 것으로 기록하지 않는다. 데이터를 고친 뒤 같은
  // 요청 ID 로 다시 시도할 수 있어야 한다.
  if (created.length === 0) {
    return {
      ok: false,
      created: [],
      incomingDocuments: ctx.incomingDocuments,
      processedRequests: ctx.processedRequests,
      rejections,
    }
  }

  return {
    ok: true,
    created,
    incomingDocuments: [...ctx.incomingDocuments, ...created],
    processedRequests: markProcessed(ctx.processedRequests, requestId, 'ISSUE_INCOMING', orderedAt),
    rejections,
  }
}
