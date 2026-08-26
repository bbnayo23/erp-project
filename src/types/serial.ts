import type { ISODateString, ItemCode, OrderId, SerialNumber, WarehouseCode } from './common'

/** 05_개체재고 개체상태 */
export type SerialStatus = '출고 완료' | '창고 보관 중' | '주문 배정됨'

/**
 * 05_개체재고 한 행 — 시리얼 관리 품목의 개체 하나.
 *
 * 04_재고현황과 이중으로 관리되는 게 아니다. 창고에 남아 있는 개체 수
 * ('창고 보관 중' + '주문 배정됨') 가 곧 그 품목의 현재고이고,
 * '주문 배정됨' 개체 수가 예약수량이다. 출고 완료 개체는 창고를 떠난 것이라 세지 않는다.
 */
export interface SerialInventory {
  serialNumber: SerialNumber

  itemCode: ItemCode
  warehouseCode: WarehouseCode

  /** 보관위치 — 'A-01-01' 형태의 랙 주소 */
  location: string

  status: SerialStatus

  /** '주문 배정됨'·'출고 완료' 개체가 묶인 주문 */
  reservedOrderId?: OrderId

  receivedAt: ISODateString
}
