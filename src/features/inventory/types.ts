import type {
  ISODateString,
  ItemCategory,
  ItemType,
  Quantity,
  SerialStatus,
  StockMovementKind,
} from '@/types'
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
  /** 01_품목 분류 — 매트리스 · 프레임 · 침구 … */
  category: ItemCategory | '-'
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

/**
 * 이 품목을 기다리는 주문 한 줄.
 *
 * 재고 화면에서 숫자가 모자란 것을 봤을 때 담당자가 바로 묻는 것은 '그래서 어느 주문이
 * 막히는가' 다. 배정 순서(우선순위)를 함께 보여야 어느 주문부터 풀리는지 알 수 있다.
 */
export interface ItemDemandRow {
  orderId: string
  /** 배정 순서 — 배송일이 빠른 주문이 1번이다 */
  priority: number
  deliveryLabel: string
  requiredQuantity: Quantity
  shortageQuantity: Quantity
  statusDescriptor: StatusDescriptor
}

/** 이 품목으로 걸려 있는 입고예정 문서 한 줄 */
export interface ItemDocumentRow {
  documentId: string
  typeLabel: string
  supplierName: string
  plannedQuantity: Quantity
  receivedQuantity: Quantity
  remainingQuantity: Quantity
  availableLabel: string
  stageDescriptor: StatusDescriptor
  /** 어느 주문의 부족분에서 나온 문서인가 */
  relatedOrderId?: string
}

/**
 * 재고 변동 이력 한 줄.
 *
 * 변화량과 변화 후 잔액을 함께 보여준다. 화면의 현재 숫자에서 거꾸로 짚어 검산할 수
 * 있어야 이력이 쓸모가 있다.
 */
export interface StockMovementRow {
  movementId: string
  kind: StockMovementKind
  kindDescriptor: StatusDescriptor
  /** 현재고 변화량 — 화면 라벨과 달리 부호가 붙은 숫자 그대로다 */
  currentDelta: Quantity
  reservedDelta: Quantity
  /** '+3' · '−2' · '-' */
  currentDeltaLabel: string
  reservedDeltaLabel: string
  currentQuantity: Quantity
  reservedQuantity: Quantity
  itemCode: string
  itemName: string
  warehouseCode: string
  warehouseName: string
  orderId?: string
  documentId?: string
  occurredLabel: string
}
