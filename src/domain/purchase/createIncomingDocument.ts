import type {
  DocumentId,
  ISODateString,
  IncomingDocument,
  IncomingDocumentType,
  InspectionStatus,
  Item,
  OrderId,
  Quantity,
  Supplier,
  WarehouseCode,
} from '@/types'
import { addDays } from '@/utils/date'

export interface CreateIncomingDocumentInput {
  documentId: DocumentId
  item: Item
  supplier: Supplier
  warehouseCode: WarehouseCode
  quantity: Quantity
  /** 발주 기준 시각 — 사용가능예정일을 리드타임으로 계산한다 */
  orderedAt: ISODateString
  /** 어떤 주문의 부족분 때문에 만들었는지 */
  relatedOrderId?: OrderId
}

/** 생산품은 생산의뢰(MO), 매입품은 구매발주(PO) 로 채운다 */
export const documentTypeOf = (item: Item): IncomingDocumentType =>
  item.itemType === '생산품' ? '생산' : '구매'

/** 생산품은 입고 전에 품질검사를 거친다. 매입품은 검사 공정이 없다. */
const initialInspectionStatus = (type: IncomingDocumentType): InspectionStatus =>
  type === '생산' ? '검사 전' : '해당 없음'

/**
 * 부족분 한 줄을 입고예정 문서 한 건으로 만든다.
 *
 * 문서를 만든 것만으로 현재고는 늘지 않는다 (00_안내). 여기서 만드는 것은 계획이고,
 * 현재고는 receiveIncoming 이 처리한다.
 *
 * documentId 와 orderedAt 을 주입받는 이유: 순수 함수로 두면 같은 입력에 같은 문서가
 * 나오고 테스트가 결정적이 된다.
 */
export function createIncomingDocument({
  documentId,
  item,
  supplier,
  warehouseCode,
  quantity,
  orderedAt,
  relatedOrderId,
}: CreateIncomingDocumentInput): IncomingDocument {
  const documentType = documentTypeOf(item)

  return {
    documentId,
    documentType,
    itemCode: item.itemCode,
    warehouseCode,
    status: documentType === '생산' ? '진행 중' : '발주 확정',
    plannedQuantity: quantity,
    receivedQuantity: 0,
    availableDate: addDays(orderedAt, supplier.leadTimeDays),
    inspectionStatus: initialInspectionStatus(documentType),
    confirmed: true,
    supplierCode: supplier.supplierCode,
    ...(relatedOrderId ? { relatedOrderId } : {}),
  }
}
