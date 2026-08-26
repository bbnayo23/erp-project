import type { ErpDatabase, Order, OrderStatus } from '@/types'

export type ShipOrderContext = Pick<
  ErpDatabase,
  'inventories' | 'serials' | 'reservations' | 'orders'
>

export interface ShipOrderResult {
  ok: boolean
  /** 예약이 없으면 출고할 수 없다 — 예약을 건너뛴 출고는 재고를 신뢰할 수 없게 만든다 */
  failure?: 'NOT_RESERVED' | 'ALREADY_SHIPPED'
  inventories: ErpDatabase['inventories']
  serials: ErpDatabase['serials']
  reservations: ErpDatabase['reservations']
  orders: ErpDatabase['orders']
}

const SHIPPED: OrderStatus = '출고 완료'

/**
 * 출고 처리 — 예약된 만큼 현재고와 예약수량을 함께 줄인다.
 *
 * 예약분만 내보낸다. 소요량을 다시 계산해 내보내면 예약을 넘어선 출고가 가능해진다.
 * 개체는 '주문 배정됨' → '출고 완료' 로 넘어가고 창고를 떠나므로 현재고에서 빠진다.
 * 예약 기록을 소비하면서 처리하므로 같은 주문을 두 번 출고할 수 없다.
 */
export function shipOrder(ctx: ShipOrderContext, order: Order): ShipOrderResult {
  const unchanged = {
    inventories: ctx.inventories,
    serials: ctx.serials,
    reservations: ctx.reservations,
    orders: ctx.orders,
  }

  if (order.status === SHIPPED || order.status === '배송 완료') {
    return { ok: false, failure: 'ALREADY_SHIPPED', ...unchanged }
  }

  const reservation = ctx.reservations.find((candidate) => candidate.orderId === order.orderId)
  if (!reservation) {
    return { ok: false, failure: 'NOT_RESERVED', ...unchanged }
  }

  const inventories = ctx.inventories.map((inventory) => {
    if (inventory.warehouseCode !== reservation.warehouseCode) return inventory
    const line = reservation.lines.find((candidate) => candidate.itemCode === inventory.itemCode)
    if (!line) return inventory
    return {
      ...inventory,
      currentQuantity: Math.max(0, inventory.currentQuantity - line.quantity),
      reservedQuantity: Math.max(0, inventory.reservedQuantity - line.quantity),
    }
  })

  const shipping = new Set(reservation.lines.flatMap((line) => line.serialNumbers))

  const serials = ctx.serials.map((serial) =>
    shipping.has(serial.serialNumber)
      ? { ...serial, status: '출고 완료' as const, reservedOrderId: order.orderId }
      : serial,
  )

  return {
    ok: true,
    inventories,
    serials,
    reservations: ctx.reservations.filter((candidate) => candidate.orderId !== order.orderId),
    orders: ctx.orders.map((candidate) =>
      candidate.orderId === order.orderId ? { ...candidate, status: SHIPPED } : candidate,
    ),
  }
}
