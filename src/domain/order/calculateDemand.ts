import type { Item } from '@/features/inventory/types'
import type { DemandLine, Order, OrderStatus } from '@/features/orders/types'
import { expandBundleLines } from './expandBundle'

/** 재고를 아직 소비하지 않은(= 앞으로 나가야 하는) 상태들 */
const OPEN_STATUSES: readonly OrderStatus[] = [
  'DRAFT',
  'CONFIRMED',
  'PARTIALLY_ALLOCATED',
  'ALLOCATED',
]

export const isOpenOrder = (order: Order) => OPEN_STATUSES.includes(order.status)

/** 수주 한 건의 실물 품목 소요량 */
export function calculateOrderDemand(items: readonly Item[], order: Order): DemandLine[] {
  return expandBundleLines(
    items,
    order.lines.map((line) => ({ itemId: line.itemId, quantity: line.quantity })),
  ).lines
}

export interface CalculateDemandInput {
  items: readonly Item[]
  orders: readonly Order[]
  /** 지정하면 해당 창고 출고 수주만 집계한다 */
  warehouseId?: string
}

/**
 * 미결 수주 전체의 품목별 소요량.
 * 출하·취소된 수주는 제외한다 — 이미 재고에 반영됐거나 사라진 수요다.
 */
export function calculateDemand({
  items,
  orders,
  warehouseId,
}: CalculateDemandInput): DemandLine[] {
  const target = orders.filter(
    (order) => isOpenOrder(order) && (!warehouseId || order.warehouseId === warehouseId),
  )

  return expandBundleLines(
    items,
    target.flatMap((order) =>
      order.lines.map((line) => ({ itemId: line.itemId, quantity: line.quantity })),
    ),
  ).lines
}

/** 품목 id → 소요량 조회용 맵 */
export function toDemandMap(demand: readonly DemandLine[]): Map<string, number> {
  return new Map(demand.map((line) => [line.itemId, line.quantity]))
}

/** 품목별로 두 소요량을 더한다 */
export function mergeDemand(
  left: readonly DemandLine[],
  right: readonly DemandLine[],
): DemandLine[] {
  const totals = new Map<string, number>()
  for (const line of [...left, ...right]) {
    totals.set(line.itemId, (totals.get(line.itemId) ?? 0) + line.quantity)
  }
  return [...totals]
    .map(([itemId, quantity]) => ({ itemId, quantity }))
    .filter((line) => line.quantity !== 0)
}

/**
 * 아직 예약되지 않은 잔여 소요량 = demand - held.
 *
 * 부분예약 수주를 다시 확정할 때 이 값으로만 예약해야 한다. 전체 소요량으로
 * 다시 예약을 시도하면 이미 잡고 있는 몫을 중복으로 잡으려 든다.
 */
export function subtractDemand(
  demand: readonly DemandLine[],
  held: readonly DemandLine[],
): DemandLine[] {
  const heldMap = toDemandMap(held)

  return demand
    .map((line) => ({
      itemId: line.itemId,
      quantity: Math.max(0, line.quantity - (heldMap.get(line.itemId) ?? 0)),
    }))
    .filter((line) => line.quantity > 0)
}
