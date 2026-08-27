import type { ISODateString, ItemType, Quantity, SerialStatus } from '@/types'
import type { StatusDescriptor } from '@/components/common/StatusBadge'

/**
 * 재고 한 칸이 지금 어떤 상태인가.
 *
 * 04_재고현황은 현재고와 예약수량 두 숫자만 준다. 담당자가 목록에서 찾는 것은 그 두
 * 숫자가 아니라 '지금 내보낼 수 있는 물건이 있는가' 이므로, 가용재고를 기준으로 묶는다.
 */
export type StockLevel =
  /** 가용재고가 남아 있다 — 새 주문에 배정할 수 있다 */
  | 'AVAILABLE'
  /** 현재고는 있지만 전량 예약됐다 — 있는데 못 쓴다 */
  | 'RESERVED'
  /** 현재고가 없고 입고예정이 있다 — 기다리면 들어온다 */
  | 'INCOMING'
  /** 현재고도 입고예정도 없다 */
  | 'EMPTY'

export type StockLevelFilter = StockLevel | 'ALL'

/**
 * 재고 현황 한 줄 — 품목 × 창고 하나.
 *
 * 04_재고현황에 없어도 확정된 입고예정이 있으면 한 줄로 세운다. 발주는 냈는데 재고
 * 화면에 아무것도 안 보이면 담당자는 발주가 사라진 줄 안다.
 */
export interface StockRow {
  /** 품목코드:창고코드 — 표의 행 키 */
  key: string

  itemCode: string
  itemName: string
  itemType: ItemType | '-'
  /** 개체 단위로 관리되는 품목인가 — 개체재고를 열 수 있다 */
  serialManaged: boolean

  warehouseCode: string
  warehouseName: string
  /** 사용 중지 창고 — 재고가 남아 있어도 출고 준비 대상이 아니다 */
  inactiveWarehouse: boolean

  currentQuantity: Quantity
  reservedQuantity: Quantity
  /** 현재고 - 예약수량 */
  availableQuantity: Quantity
  /** 확정된 입고예정 문서의 잔여 합계 */
  incomingQuantity: Quantity

  level: StockLevel
  levelDescriptor: StatusDescriptor

  /** 창고에 남아 있는 개체 수 ('창고 보관 중') */
  storedSerialCount: number
  /** 주문에 배정된 개체 수 ('주문 배정됨') */
  assignedSerialCount: number
  /**
   * 04_재고현황과 05_개체재고가 어긋났다.
   * 시리얼 품목은 보관 + 배정 = 현재고여야 한다 — 예약이 SERIAL_SHORTAGE 로 막히는 원인이다.
   */
  serialMismatch: boolean

  /** 04_재고현황 기존예약주문번호 — 시트가 적어 둔 선행 예약 */
  existingReservationOrderId?: string
}

/** 개체재고 서랍의 한 줄 (05_개체재고) */
export interface SerialRow {
  serialNumber: string
  location: string
  status: SerialStatus
  statusDescriptor: StatusDescriptor
  /** 배정·출고된 개체가 묶인 주문 */
  reservedOrderId?: string
  /** 2026.07.19 */
  receivedLabel: string
  receivedAt: ISODateString
}

export interface InventoryFilter {
  level: StockLevelFilter
  /** 창고코드. 'ALL' 이면 전체 */
  warehouseCode: string
  /** 품목코드 · 품목명 부분 일치 */
  keyword: string
}
