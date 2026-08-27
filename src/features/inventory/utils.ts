import type {
  ErpDatabase,
  Inventory,
  ItemCode,
  SerialInventory,
  SerialStatus,
  Warehouse,
  WarehouseCode,
} from '@/types'
import type { RowTone } from '@/components/common/DataTable'
import type { StatusDescriptor } from '@/components/common/StatusBadge'
import type { SummaryCardItem } from '@/components/common/SummaryCards'
import { getAvailableQuantity } from '@/domain/inventory/getAvailableQuantity'
import { findItem, isSerialManaged } from '@/domain/master/itemRules'
import { findWarehouse, isActiveWarehouse } from '@/domain/master/warehouseRules'
import {
  calculateIncomingQuantity,
  isIncomingPlanned,
} from '@/domain/purchase/getRemainingQuantity'
import { formatDate } from '@/utils/date'
import { sumBy } from '@/utils/number'
import type { InventoryFilter, SerialRow, StockLevel, StockLevelFilter, StockRow } from './types'

/**
 * 재고 상태 → 화면 표시.
 *
 * 여기서 새로 계산하는 숫자는 없다. 가용재고는 domain/inventory 가, 입고예정 잔여는
 * domain/purchase 가 이미 답을 갖고 있다 — 이 파일은 그것을 한 줄로 옮기고 이름을 붙인다.
 */

export const STOCK_LEVEL: Record<StockLevel, StatusDescriptor> = {
  AVAILABLE: { label: '배정 가능', tone: 'success' },
  RESERVED: { label: '전량 예약', tone: 'primary' },
  INCOMING: { label: '입고 예정', tone: 'info' },
  EMPTY: { label: '재고 없음', tone: 'neutral' },
}

/** 목록에 노출할 순서. 쓸 수 있는 것부터, 아무것도 없는 것이 맨 뒤로. */
export const LEVEL_ORDER: StockLevel[] = ['AVAILABLE', 'RESERVED', 'INCOMING', 'EMPTY']

export const SERIAL_STATUS: Record<SerialStatus, StatusDescriptor> = {
  '창고 보관 중': { label: '창고 보관 중', tone: 'success' },
  '주문 배정됨': { label: '주문 배정됨', tone: 'primary' },
  '출고 완료': { label: '출고 완료', tone: 'neutral' },
}

export const stockKey = (itemCode: ItemCode, warehouseCode: WarehouseCode): string =>
  `${itemCode}:${warehouseCode}`

/**
 * 가용재고가 있으면 배정할 수 있고, 현재고가 있는데 가용이 0이면 전량 예약된 것이다.
 * 둘 다 없을 때만 입고예정을 본다 — 있는 물건이 기다리는 물건보다 먼저다.
 */
export function levelOf(
  currentQuantity: number,
  availableQuantity: number,
  incomingQuantity: number,
): StockLevel {
  if (availableQuantity > 0) return 'AVAILABLE'
  if (currentQuantity > 0) return 'RESERVED'
  return incomingQuantity > 0 ? 'INCOMING' : 'EMPTY'
}

type StockContext = Pick<
  ErpDatabase,
  'items' | 'warehouses' | 'inventories' | 'serials' | 'incomingDocuments'
>

const countSerials = (
  serials: readonly SerialInventory[],
  itemCode: ItemCode,
  warehouseCode: WarehouseCode,
  status: SerialStatus,
): number =>
  serials.filter(
    (serial) =>
      serial.itemCode === itemCode &&
      serial.warehouseCode === warehouseCode &&
      serial.status === status,
  ).length

function toStockRow(
  ctx: StockContext,
  itemCode: ItemCode,
  warehouseCode: WarehouseCode,
  inventory: Inventory | undefined,
): StockRow {
  const item = findItem(ctx.items, itemCode)
  const warehouse = findWarehouse(ctx.warehouses, warehouseCode)

  const currentQuantity = inventory?.currentQuantity ?? 0
  const reservedQuantity = inventory?.reservedQuantity ?? 0
  const availableQuantity = getAvailableQuantity(inventory)
  // 배송일을 넘기지 않고 앞으로 들어올 물량 전부. 특정 주문의 배송일 기준이 아니다 —
  // 이 화면은 주문과 무관하게 창고에 무엇이 있고 무엇이 들어오는지를 본다.
  const incomingQuantity = calculateIncomingQuantity(ctx, itemCode, warehouseCode)

  const serialManaged = item ? isSerialManaged(item) : false
  const storedSerialCount = serialManaged
    ? countSerials(ctx.serials, itemCode, warehouseCode, '창고 보관 중')
    : 0
  const assignedSerialCount = serialManaged
    ? countSerials(ctx.serials, itemCode, warehouseCode, '주문 배정됨')
    : 0

  const level = levelOf(currentQuantity, availableQuantity, incomingQuantity)

  return {
    key: stockKey(itemCode, warehouseCode),

    itemCode,
    // 등록되지 않은 품목은 코드를 그대로 보여준다 — 이름이 없다고 행을 숨기면 놓친다
    itemName: item?.itemName ?? itemCode,
    itemType: item?.itemType ?? '-',
    serialManaged,

    warehouseCode,
    warehouseName: warehouse?.warehouseName ?? warehouseCode,
    inactiveWarehouse: warehouse !== undefined && !isActiveWarehouse(warehouse),

    currentQuantity,
    reservedQuantity,
    availableQuantity,
    incomingQuantity,

    level,
    levelDescriptor: STOCK_LEVEL[level],

    storedSerialCount,
    assignedSerialCount,
    // 시리얼 품목은 창고에 남아 있는 개체 수가 곧 현재고다 (README '데이터')
    serialMismatch: serialManaged && storedSerialCount + assignedSerialCount !== currentQuantity,

    ...(inventory?.existingReservationOrderId
      ? { existingReservationOrderId: inventory.existingReservationOrderId }
      : {}),
  }
}

/**
 * 04_재고현황과 확정된 입고예정을 합쳐 품목 × 창고 한 줄씩 세운다.
 *
 * 재고 행이 없는 조합도 남기는 이유: 새로 낸 발주는 입고하기 전까지 04_재고현황에
 * 나타나지 않는다. 그때 이 화면이 비어 있으면 담당자는 발주가 사라진 줄 안다.
 */
export function toStockRows(ctx: StockContext): StockRow[] {
  const combinations = new Map<string, { itemCode: ItemCode; warehouseCode: WarehouseCode }>()

  for (const inventory of ctx.inventories) {
    combinations.set(stockKey(inventory.itemCode, inventory.warehouseCode), {
      itemCode: inventory.itemCode,
      warehouseCode: inventory.warehouseCode,
    })
  }

  for (const document of ctx.incomingDocuments) {
    if (!isIncomingPlanned(document)) continue
    combinations.set(stockKey(document.itemCode, document.warehouseCode), {
      itemCode: document.itemCode,
      warehouseCode: document.warehouseCode,
    })
  }

  return [...combinations.values()]
    .map(({ itemCode, warehouseCode }) =>
      toStockRow(
        ctx,
        itemCode,
        warehouseCode,
        ctx.inventories.find(
          (inventory) =>
            inventory.itemCode === itemCode && inventory.warehouseCode === warehouseCode,
        ),
      ),
    )
    .sort(compareRows)
}

/**
 * 쓸 수 있는 재고부터, 같은 단계 안에서는 품목 → 창고 순.
 *
 * 04_재고현황의 시트 순서를 지킬 이유가 없다 — 배송 준비 현황과 달리 이 목록의 순서에는
 * 업무적 의미가 없다.
 */
export const compareRows = (a: StockRow, b: StockRow): number =>
  LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) ||
  a.itemCode.localeCompare(b.itemCode) ||
  a.warehouseCode.localeCompare(b.warehouseCode)

/** 한 품목 × 창고의 개체 목록. 먼저 들어온 개체가 위로 온다 — 예약이 FIFO 로 가져가는 순서다. */
export function toSerialRows(
  serials: readonly SerialInventory[],
  itemCode: ItemCode,
  warehouseCode: WarehouseCode,
): SerialRow[] {
  return serials
    .filter((serial) => serial.itemCode === itemCode && serial.warehouseCode === warehouseCode)
    .map((serial) => ({
      serialNumber: serial.serialNumber,
      location: serial.location,
      status: serial.status,
      statusDescriptor: SERIAL_STATUS[serial.status],
      receivedLabel: formatDate(serial.receivedAt),
      receivedAt: serial.receivedAt,
      ...(serial.reservedOrderId ? { reservedOrderId: serial.reservedOrderId } : {}),
    }))
    .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))
}

export const matchesFilter = (row: StockRow, filter: InventoryFilter): boolean => {
  if (filter.level !== 'ALL' && row.level !== filter.level) return false
  if (filter.warehouseCode !== 'ALL' && row.warehouseCode !== filter.warehouseCode) return false

  const keyword = filter.keyword.trim().toUpperCase()
  if (!keyword) return true

  return (
    row.itemCode.toUpperCase().includes(keyword) || row.itemName.toUpperCase().includes(keyword)
  )
}

/**
 * 행 좌측 상태 레일의 색.
 *
 * 개체 불일치가 있으면 재고 상태와 무관하게 붉게 세운다 — 수량이 맞아 보여도 예약이
 * SERIAL_SHORTAGE 로 막히는 행이고, 담당자가 가장 먼저 알아야 하는 사건이다.
 */
export const rowToneOf = (row: StockRow): RowTone =>
  row.serialMismatch ? 'danger' : STOCK_LEVEL[row.level].tone

/**
 * 요약 카드.
 *
 * 세는 대상은 필터 이전의 전체다. 필터를 걸 때마다 요약이 같이 움직이면 지금 걸린
 * 필터가 얼마나 걸러냈는지 알 수 없다.
 *
 * 합계 카드(현재고·예약수량·가용재고)는 누를 수 없다. 걸러낼 대상이 아니라 총량이라
 * 버튼으로 두면 눌러도 아무 일이 없는 자리가 생긴다.
 */
export function toSummaryItems(
  rows: readonly StockRow[],
  selection?: {
    current: StockLevelFilter
    onSelect: (next: StockLevelFilter) => void
  },
): SummaryCardItem[] {
  const countOf = (level: StockLevel) => rows.filter((row) => row.level === level).length
  const mismatch = rows.filter((row) => row.serialMismatch).length
  const inactive = rows.filter((row) => row.inactiveWarehouse && row.currentQuantity > 0).length

  const card = (
    label: string,
    value: string,
    target: StockLevelFilter,
    extra: Partial<SummaryCardItem> = {},
  ): SummaryCardItem => ({
    label,
    value,
    ...extra,
    ...(selection
      ? {
          onSelect: () => selection.onSelect(target),
          selected: selection.current === target,
        }
      : {}),
  })

  return [
    card(
      '품목 × 창고',
      `${rows.length}건`,
      'ALL',
      // 04_재고현황과 05_개체재고가 어긋나면 예약이 막힌다 — 먼저 보여야 한다
      mismatch > 0
        ? { hint: `개체 불일치 ${mismatch}건`, tone: 'danger' as const }
        : { hint: '재고 행 · 확정된 입고예정' },
    ),
    {
      label: '현재고',
      value: `${sumBy(rows, (row) => row.currentQuantity)}개`,
      ...(inactive > 0 ? { hint: `사용 중지 창고 ${inactive}건` } : {}),
    },
    { label: '예약수량', value: `${sumBy(rows, (row) => row.reservedQuantity)}개` },
    {
      label: '가용재고',
      value: `${sumBy(rows, (row) => row.availableQuantity)}개`,
      hint: '현재고 − 예약수량',
    },
    card('배정 가능', `${countOf('AVAILABLE')}건`, 'AVAILABLE', { tone: 'point' as const }),
    card('전량 예약', `${countOf('RESERVED')}건`, 'RESERVED', { tone: 'warning' as const }),
    card('입고 예정', `${countOf('INCOMING')}건`, 'INCOMING', { hint: '현재고 없이 대기' }),
  ]
}

export const LEVEL_FILTER_OPTIONS = [
  { value: 'ALL', label: '전체 상태' },
  ...LEVEL_ORDER.map((level) => ({ value: level, label: STOCK_LEVEL[level].label })),
]

/** 사용 중지 창고도 남긴다 — 재고가 남아 있고, 그 사실 자체가 담당자가 봐야 하는 것이다 */
export const warehouseFilterOptions = (warehouses: readonly Warehouse[]) => [
  { value: 'ALL', label: '전체 창고' },
  ...warehouses.map((warehouse) => ({
    value: warehouse.warehouseCode,
    label: warehouse.warehouseName,
  })),
]
