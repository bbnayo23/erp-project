import type { IsoDate } from '@/utils/date'

/**
 * 기준정보 + 재고 도메인 타입.
 * Item / Warehouse 는 세 피처가 모두 참조하는 마스터 데이터라 재고 쪽에 둔다.
 */

export type ItemType = 'SINGLE' | 'BUNDLE'

export interface BundleComponent {
  itemId: string
  /** 번들 1개당 필요 수량 */
  quantity: number
}

export interface Item {
  id: string
  code: string
  name: string
  type: ItemType
  /** EA, SET 같은 재고 단위 */
  unit: string
  unitPrice: number
  /** 발주 리드타임(일) — 입고 예정일 계산에 쓴다 */
  leadTimeDays: number
  /** 이 수량 아래로 내려가지 않게 발주 소요량에 더한다 */
  safetyStock: number
  supplier: string
  /** BUNDLE 일 때만 채워진다. 구성품이 다시 번들일 수도 있다. */
  components?: BundleComponent[]
}

export interface Warehouse {
  id: string
  code: string
  name: string
  isDefault: boolean
}

/** 품목 × 창고 단위의 재고 한 줄 */
export interface InventoryRecord {
  itemId: string
  warehouseId: string
  /** 창고에 실제로 있는 수량 */
  onHand: number
  /** 확정된 수주에 묶여 출고를 기다리는 수량 */
  reserved: number
  updatedAt: IsoDate
}

/** onHand/reserved 를 바꾸는 단위 변경량. 도메인 함수가 이 형태로 결과를 낸다. */
export interface InventoryDelta {
  itemId: string
  warehouseId: string
  onHand?: number
  reserved?: number
}

export type StockLevel = 'OUT_OF_STOCK' | 'BELOW_SAFETY' | 'HEALTHY'

/** 화면에 뿌리는 재고 한 줄 (엔티티 + 파생값) */
export interface InventoryRow {
  itemId: string
  itemCode: string
  itemName: string
  itemType: ItemType
  unit: string
  warehouseId: string
  warehouseName: string
  onHand: number
  reserved: number
  available: number
  safetyStock: number
  /** 미결 수주가 요구하는 수량 (번들 전개 후) */
  demand: number
  /** 발주 완료·미입고 수량 */
  incoming: number
  level: StockLevel
  updatedAt: IsoDate
}

export interface InventoryFilter {
  keyword: string
  warehouseId: string | 'ALL'
  onlyRisk: boolean
}

export interface InventorySummary {
  total: number
  outOfStock: number
  belowSafety: number
  /** 가용 + 입고예정으로도 소요량을 못 채우는 항목 수 */
  uncovered: number
}

export interface UseInventoryRowsResult {
  rows: InventoryRow[]
  filter: InventoryFilter
  setFilter: (next: Partial<InventoryFilter>) => void
  summary: InventorySummary
}
