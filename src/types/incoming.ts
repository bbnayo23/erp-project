import type {
  DocumentId,
  ISODateString,
  ItemCode,
  OrderId,
  Quantity,
  SupplierCode,
  WarehouseCode,
} from './common'

/** 07_입고예정 문서구분 — 구매는 발주(PO), 생산은 생산의뢰(MO) */
export type IncomingDocumentType = '구매' | '생산'

/** 07_입고예정 진행상태 */
export type IncomingProgressStatus =
  '작성 중' | '발주 확정' | '진행 중' | '생산 완료' | '검사 완료' | '부분 입고' | '입고 완료'

/** 07_입고예정 검사상태. '해당 없음' 은 검사 공정이 없는 매입품이다. */
export type InspectionStatus = '검사 전' | '검사 대기' | '검사 완료' | '해당 없음'

/**
 * 07_입고예정 한 행.
 *
 * 잔여수량(계획수량 - 입고수량)은 필드로 두지 않는다 — Inventory 의 가용재고와 같은 이유다.
 * 계산은 domain/purchase/getRemainingQuantity 에 있다.
 */
export interface IncomingDocument {
  documentId: DocumentId
  documentType: IncomingDocumentType

  itemCode: ItemCode
  warehouseCode: WarehouseCode

  status: IncomingProgressStatus

  plannedQuantity: Quantity
  /** 이미 창고에 들어와 현재고에 반영된 수량 */
  receivedQuantity: Quantity

  availableDate: ISODateString

  inspectionStatus: InspectionStatus

  /** 07_입고예정 확정여부. '작성 중' 미확정 문서는 입고예정으로 세지 않는다. */
  confirmed: boolean

  supplierCode: SupplierCode

  /**
   * 시트에는 없는 앱 확장 필드.
   * 어떤 주문의 부족분 때문에 만든 문서인지 되짚을 수 있어야 한다.
   */
  relatedOrderId?: OrderId

  /** 품질검사 비고 — 불합격 사유를 담당자가 남긴다 */
  inspectionNote?: string
}
