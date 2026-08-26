import type { ItemType } from '@/features/inventory/types'
import type { IsoDate } from '@/utils/date'

/**
 * 수주 도메인 타입.
 *
 * 상태 흐름
 *   DRAFT ──확정──▶ CONFIRMED ──재고예약──▶ PARTIALLY_ALLOCATED / ALLOCATED ──출하──▶ SHIPPED
 *     └──────────────────────────취소──────────────────────────▶ CANCELLED
 */

export type OrderStatus =
  'DRAFT' | 'CONFIRMED' | 'PARTIALLY_ALLOCATED' | 'ALLOCATED' | 'SHIPPED' | 'CANCELLED'

export interface OrderLine {
  id: string
  /** 번들 품목일 수 있다 — 재고 예약 전에 구성품으로 전개한다 */
  itemId: string
  quantity: number
  unitPrice: number
}

/** 번들을 전개해 얻은 실물 품목 소요량 */
export interface DemandLine {
  itemId: string
  quantity: number
}

export interface Order {
  id: string
  code: string
  customerName: string
  orderedAt: IsoDate
  dueDate: IsoDate
  /** 출고 창고 — 예약·출하 모두 이 창고에서 일어난다 */
  warehouseId: string
  status: OrderStatus
  lines: OrderLine[]
  /**
   * 이 수주가 현재 잡고 있는 예약 수량 (번들 전개 후 실물 품목 기준).
   *
   * InventoryRecord.reserved 는 창고 합계라서 누구의 예약인지 알 수 없다.
   * 수주별로 들고 있지 않으면 (1) 한 수주를 취소할 때 다른 수주의 예약까지 풀리고,
   * (2) 부분예약 수주를 다시 확정할 때 이미 잡은 몫을 또 예약하려 든다.
   */
  allocated?: DemandLine[]
  memo?: string
}

/** 소요량 한 건에 대한 예약 결과 */
export interface AllocationLine {
  itemId: string
  /** 요구 수량 */
  required: number
  /** 실제로 예약된 수량 */
  allocated: number
  /** required - allocated */
  shortage: number
}

export interface AllocationResult {
  lines: AllocationLine[]
  /** 전부 예약됐는지 */
  fullyAllocated: boolean
  /** 한 건도 예약되지 않았는지 */
  nothingAllocated: boolean
}

/** 화면에 뿌리는 수주 한 줄 */
export interface OrderRow {
  order: Order
  warehouseName: string
  /** 라인 합계 금액 */
  totalAmount: number
  totalQuantity: number
  /** 납기 초과 여부 */
  overdue: boolean
  /** 현재 재고로 전량 출고 가능한지 */
  shippable: boolean
}

export interface OrderFilter {
  keyword: string
  status: OrderStatus | 'ALL'
  warehouseId: string | 'ALL'
}

/** 상세 패널의 수주 라인 (품목 정보 결합) */
export interface OrderLineRow {
  id: string
  itemCode: string
  itemName: string
  itemType: ItemType
  unit: string
  quantity: number
  unitPrice: number
  amount: number
}

/** 상세 패널의 구성품 한 줄 — 번들을 전개한 실물 품목 기준 */
export interface OrderComponentRow {
  itemId: string
  itemCode: string
  itemName: string
  unit: string
  /** 이 수주가 요구하는 수량 */
  required: number
  /** 이 수주가 이미 잡고 있는 예약 수량 */
  allocated: number
  /** 창고 가용 재고 (예약분 제외) */
  available: number
  incoming: number
  /** 아직 예약하지 못한 수량 — 지금 확정해도 못 채우는 몫 */
  shortage: number
}

export interface OrderDetail {
  order: Order
  warehouseName: string
  totalAmount: number
  lines: OrderLineRow[]
  components: OrderComponentRow[]
}

export interface OrderSummary {
  total: number
  /** 확정·부분예약 — 재고를 기다리는 수주 */
  awaitingStock: number
  shippable: number
  overdue: number
}

export interface UseOrderRowsResult {
  rows: OrderRow[]
  filter: OrderFilter
  setFilter: (next: Partial<OrderFilter>) => void
  summary: OrderSummary
}
