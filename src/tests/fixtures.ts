import type {
  BundleComponent,
  ErpDatabase,
  IncomingDocument,
  Inventory,
  Item,
  Order,
  OrderItem,
  OrderPreparation,
  PreparationItem,
  SerialInventory,
  Supplier,
  Warehouse,
} from '@/types'
import type { PreparationPlan, PreparationPlanEntry } from '@/domain/preparation/planPreparation'
import { findPlanEntry } from '@/domain/preparation/planPreparation'

/**
 * 테스트용 최소 데이터.
 *
 * 시드 데이터(data/seed)를 쓰지 않는다. 29건의 주문과 8개 시트가 얽힌 상태에서
 * 한 규칙만 확인하려면 무엇이 원인인지 좁힐 수 없고, 시드 한 줄만 고쳐도 무관한
 * 테스트가 깨진다. 여기서는 검증하려는 규칙에 필요한 최소 행만 손으로 세운다.
 */

export const BASE_AT = '2026-07-21T09:00:00+09:00'

/** 기준시각 다음 날부터 날짜를 만든다 — 배송일 관련 규칙을 읽기 쉽게 쓰기 위한 도우미 */
export const at = (day: number, time = '09:00:00'): string =>
  `2026-07-${String(day).padStart(2, '0')}T${time}+09:00`

export const ITEMS: Item[] = [
  {
    itemCode: 'MAT-Q',
    itemName: '매트리스 Q',
    category: '매트리스',
    specification: 'Q',
    itemType: '생산품',
    serialManaged: true,
    defaultSupplierCode: 'SUP-PROD',
  },
  {
    itemCode: 'FRM-Q',
    itemName: '프레임 Q',
    category: '프레임',
    specification: 'Q',
    itemType: '매입품',
    serialManaged: true,
    defaultSupplierCode: 'SUP-BUY',
  },
  {
    itemCode: 'PIL-STD',
    itemName: '베개',
    category: '베개',
    specification: 'STD',
    itemType: '매입품',
    serialManaged: false,
    defaultSupplierCode: 'SUP-BUY',
  },
  {
    itemCode: 'PAD-STD',
    itemName: '패드',
    category: '침구',
    specification: 'STD',
    itemType: '매입품',
    serialManaged: false,
    // 기본공급처가 없다 — 발주 시점에 MISSING_SUPPLIER 로 걸린다
  },
  {
    itemCode: 'SET-001',
    itemName: '침대 세트 Q',
    category: '결합제품',
    specification: 'Q',
    itemType: '세트상품',
    serialManaged: false,
  },
  {
    itemCode: 'SET-EMPTY',
    itemName: '구성 없는 세트',
    category: '결합제품',
    itemType: '세트상품',
    serialManaged: false,
  },
  {
    itemCode: 'SET-CYCLE',
    itemName: '자기를 품는 세트',
    category: '결합제품',
    itemType: '세트상품',
    serialManaged: false,
  },
  {
    itemCode: 'SVC-INSTALL',
    itemName: '설치 서비스',
    category: '서비스',
    itemType: '서비스',
    serialManaged: false,
  },
  {
    itemCode: 'SVC-DISPOSAL',
    itemName: '기존 매트리스 수거',
    category: '서비스',
    itemType: '서비스',
    serialManaged: false,
  },
]

/** SET-001 = 매트리스 1 + 프레임 1 + 베개 2 + 설치 서비스(출고 대상 아님) */
export const BUNDLE_COMPONENTS: BundleComponent[] = [
  { bundleItemCode: 'SET-001', componentItemCode: 'MAT-Q', quantity: 1, isOutboundTarget: true },
  { bundleItemCode: 'SET-001', componentItemCode: 'FRM-Q', quantity: 1, isOutboundTarget: true },
  { bundleItemCode: 'SET-001', componentItemCode: 'PIL-STD', quantity: 2, isOutboundTarget: true },
  {
    bundleItemCode: 'SET-001',
    componentItemCode: 'SVC-INSTALL',
    quantity: 1,
    isOutboundTarget: false,
  },
  {
    bundleItemCode: 'SET-CYCLE',
    componentItemCode: 'SET-CYCLE',
    quantity: 1,
    isOutboundTarget: true,
  },
]

export const WAREHOUSES: Warehouse[] = [
  { warehouseCode: 'WH-01', warehouseName: '중앙물류센터', status: '사용 중' },
  { warehouseCode: 'WH-02', warehouseName: '남부물류센터', status: '사용 중' },
  { warehouseCode: 'WH-LEGACY', warehouseName: '구 창고', status: '사용 중지' },
]

export const SUPPLIERS: Supplier[] = [
  { supplierCode: 'SUP-BUY', supplierName: '한샘침구', type: '구매처', leadTimeDays: 3 },
  { supplierCode: 'SUP-PROD', supplierName: '자사 생산1공장', type: '생산처', leadTimeDays: 5 },
]

/** 인메모리 DB 한 벌. 검증에 필요한 컬렉션만 넘기면 나머지는 비어 있다. */
export const db = (overrides: Partial<ErpDatabase> = {}): ErpDatabase => ({
  items: ITEMS,
  bundleComponents: BUNDLE_COMPONENTS,
  warehouses: WAREHOUSES,
  inventories: [],
  serials: [],
  orders: [],
  incomingDocuments: [],
  suppliers: SUPPLIERS,
  reservations: [],
  shipments: [],
  stockMovements: [],
  processedRequests: [],
  baseAt: BASE_AT,
  ...overrides,
})

interface OrderOptions {
  id: string
  items: Array<Pick<OrderItem, 'itemCode' | 'quantity'> & Partial<OrderItem>>
  status?: Order['status']
  /** 배송예정일 — 일(day) 만 넘긴다 */
  deliveryDay?: number
  /** 주문접수일시 — 배송일 동순위를 가를 때 쓴다 */
  orderedAt?: string
  warehouseCode?: string
}

export const order = ({
  id,
  items,
  status = '주문 확정',
  deliveryDay = 25,
  orderedAt = BASE_AT,
  warehouseCode = 'WH-01',
}: OrderOptions): Order => ({
  orderId: id,
  status,
  orderedAt,
  deliveryDate: at(deliveryDay),
  warehouseCode,
  items: items.map((item, index) => ({
    sequence: index + 1,
    status: '정상',
    ...item,
  })),
  updatedAt: BASE_AT,
})

export const inventory = (
  itemCode: string,
  currentQuantity: number,
  reservedQuantity = 0,
  warehouseCode = 'WH-01',
): Inventory => ({
  baseAt: BASE_AT,
  warehouseCode,
  itemCode,
  currentQuantity,
  reservedQuantity,
})

export const serial = (
  serialNumber: string,
  itemCode: string,
  options: Partial<SerialInventory> = {},
): SerialInventory => ({
  serialNumber,
  itemCode,
  warehouseCode: 'WH-01',
  location: 'A-01-01',
  status: '창고 보관 중',
  receivedAt: at(1),
  ...options,
})

interface IncomingOptions {
  id: string
  itemCode: string
  plannedQuantity: number
  /** 사용가능예정일 — 일(day) 만 넘긴다 */
  availableDay: number
  receivedQuantity?: number
  documentType?: IncomingDocument['documentType']
  status?: IncomingDocument['status']
  inspectionStatus?: IncomingDocument['inspectionStatus']
  confirmed?: boolean
  warehouseCode?: string
  supplierCode?: string
}

export const incoming = ({
  id,
  itemCode,
  plannedQuantity,
  availableDay,
  receivedQuantity = 0,
  documentType = '구매',
  status = '발주 확정',
  inspectionStatus = '해당 없음',
  confirmed = true,
  warehouseCode = 'WH-01',
  supplierCode = 'SUP-BUY',
}: IncomingOptions): IncomingDocument => ({
  documentId: id,
  documentType,
  itemCode,
  warehouseCode,
  status,
  plannedQuantity,
  receivedQuantity,
  availableDate: at(availableDay),
  inspectionStatus,
  confirmed,
  supplierCode,
})

/**
 * 도메인 함수 결과를 DB 에 대입한다.
 *
 * 스토어 액션이 할 일을 테스트에서 대신하는 것이다 — 프론트 전용 구성에서는
 * zustand 의 set() 한 번이 트랜잭션 경계이므로, 결과를 통째로 대입하는 이 모양이
 * 실제 동작과 같다.
 */
export const commit = (base: ErpDatabase, patch: Partial<ErpDatabase>): ErpDatabase => ({
  ...base,
  ...patch,
})

/**
 * 조회 도우미. noUncheckedIndexedAccess 아래에서 인덱스 접근마다 undefined 를 풀면
 * 테스트의 의도가 묻힌다. 없으면 그 자리에서 실패하는 게 낫다.
 */

export const entryOf = (plan: PreparationPlan, orderId: string): PreparationPlanEntry => {
  const entry = findPlanEntry(plan, orderId)
  if (!entry) throw new Error(`계획에 ${orderId} 가 없다`)
  return entry
}

export const lineOf = (preparation: OrderPreparation, itemCode: string): PreparationItem => {
  const line = preparation.items.find((item) => item.itemCode === itemCode)
  if (!line) throw new Error(`판정 결과에 ${itemCode} 가 없다`)
  return line
}

export const inventoryOf = (
  inventories: readonly Inventory[],
  itemCode: string,
  warehouseCode = 'WH-01',
): Inventory => {
  const found = inventories.find(
    (candidate) => candidate.itemCode === itemCode && candidate.warehouseCode === warehouseCode,
  )
  if (!found) throw new Error(`재고에 ${itemCode}@${warehouseCode} 가 없다`)
  return found
}

export const itemOf = (itemCode: string): Item => {
  const found = ITEMS.find((item) => item.itemCode === itemCode)
  if (!found) throw new Error(`품목에 ${itemCode} 가 없다`)
  return found
}

export const blockCodes = (preparation: OrderPreparation): string[] =>
  preparation.blockingReasons.map((block) => block.code)
