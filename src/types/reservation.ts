import type {
  ISODateString,
  ItemCode,
  OrderId,
  Quantity,
  SerialNumber,
  WarehouseCode,
} from './common'

/**
 * 앱이 만든 예약 한 건. 시트에는 없는 확장 엔티티다.
 *
 * 04_재고현황의 `기존예약주문번호` 는 주문을 한 건만 적고 있어, 같은 품목을 여러
 * 주문이 예약하면 누구의 몫인지 구분할 수 없다. 그 상태로 취소를 처리하면 남의 예약이
 * 풀리고, 같은 주문을 두 번 처리하면 재고가 중복 차감된다.
 *
 * 그래서 예약을 주문별로 기록한다. 이 기록이 곧 멱등성 판정 근거가 된다 —
 * 같은 주문의 예약이 이미 있으면 다시 잡지 않는다 (00_안내 마지막 규칙).
 */
export interface Reservation {
  orderId: OrderId
  warehouseCode: WarehouseCode

  lines: ReservationLine[]

  reservedAt: ISODateString
}

export interface ReservationLine {
  itemCode: ItemCode
  quantity: Quantity
  /** 시리얼 관리 품목이면 배정된 개체 번호. 비관리 품목은 빈 배열이다. */
  serialNumbers: SerialNumber[]
}
