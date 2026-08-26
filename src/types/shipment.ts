import type {
  ISODateString,
  ItemCode,
  OrderId,
  Quantity,
  SerialNumber,
  WarehouseCode,
} from './common'

/**
 * 출고 이력 한 건. 시트에는 없는 앱 확장 엔티티다.
 *
 * 주문상태를 '출고 완료' 로 바꾸는 것만으로는 부족하다. 무엇을 몇 개, 어느 개체로
 * 내보냈는지 남지 않으면 재고 숫자가 맞는지 되짚을 수 없고, 같은 출고가 두 번
 * 반영됐는지도 알 수 없다.
 *
 * 이력은 예약 기록의 사본이 아니다. 예약은 출고와 함께 소비되어 사라지므로
 * (shipOrder 가 Reservation 을 지운다) 출고 시점의 배정 내역은 여기에만 남는다.
 */
export interface Shipment {
  /** 출고 요청 ID. 이 값이 멱등성 키다 — 같은 값으로 두 번 요청해도 이력은 하나다. */
  shipmentId: string

  orderId: OrderId
  warehouseCode: WarehouseCode

  lines: ShipmentLine[]

  shippedAt: ISODateString
}

export interface ShipmentLine {
  itemCode: ItemCode
  quantity: Quantity
  /** 실제로 창고를 떠난 개체 번호. 비관리 품목은 빈 배열이다. */
  serialNumbers: SerialNumber[]
}
