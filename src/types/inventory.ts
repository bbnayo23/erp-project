import type { ISODateString, ItemCode, OrderId, Quantity, WarehouseCode } from './common'

/**
 * 04_재고현황 한 행 — 품목 × 창고의 기준시각 스냅샷.
 *
 * 가용재고는 필드로 두지 않는다. 현재고나 예약수량만 바꾸고 가용재고를 갱신하지 않는
 * 실수가 구조적으로 불가능해야 한다. 계산은 domain/inventory/getAvailableQuantity 에 있다.
 */
export interface Inventory {
  baseAt: ISODateString

  warehouseCode: WarehouseCode
  itemCode: ItemCode

  /** 창고에 실제로 있는 수량. 부분 입고된 수량은 이미 여기 반영돼 있다. */
  currentQuantity: Quantity

  /** 선행 주문이 잡아둔 수량 */
  reservedQuantity: Quantity

  /**
   * 04_재고현황 기존예약주문번호.
   * 시트는 예약을 만든 주문을 한 건만 적고 있어 누적 예약을 주문별로 나눌 수 없다.
   * 앱이 새로 만드는 예약은 Reservation 으로 따로 추적한다.
   */
  existingReservationOrderId?: OrderId
}
