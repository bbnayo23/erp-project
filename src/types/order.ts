import type { ISODateString, ItemCode, OrderId, Quantity, WarehouseCode } from './common'

/** 06_주문 주문상태 */
export type OrderStatus = '주문 확정' | '취소' | '출고 완료' | '배송 완료'

/** 06_주문 품목상태 — 주문은 살아 있고 품목만 빠지는 경우가 있다 */
export type OrderItemStatus = '정상' | '취소'

/**
 * 06_주문 한 행.
 *
 * 시트는 주문 하나를 품목별 여러 행으로 갖고 있다. 화면에서 쓰기 전에
 * domain/order/groupOrderRows 로 주문 단위로 접는다.
 * 이 타입은 시트와 1:1 이므로 엑셀을 다시 내보내도 그대로 대응된다.
 */
export interface OrderRow {
  orderId: OrderId
  itemSequence: number

  orderStatus: OrderStatus
  itemStatus: OrderItemStatus

  orderedAt: ISODateString
  deliveryDate: ISODateString

  warehouseCode: WarehouseCode

  itemCode: ItemCode
  quantity: Quantity

  updatedAt: ISODateString
}

export interface OrderItem {
  sequence: number
  itemCode: ItemCode
  quantity: Quantity
  /** '취소' 품목은 준비 대상에서 빠지지만 목록에는 남는다 */
  status: OrderItemStatus
}

export interface Order {
  orderId: OrderId

  status: OrderStatus

  orderedAt: ISODateString
  deliveryDate: ISODateString

  /** 출고 창고 — 예약·출고가 모두 이 창고에서 일어난다 */
  warehouseCode: WarehouseCode

  items: OrderItem[]

  updatedAt: ISODateString
}

/** 세트를 풀고 서비스를 걷어낸 뒤 남는 실물 품목 소요량 */
export interface DemandLine {
  itemCode: ItemCode
  quantity: Quantity
}
