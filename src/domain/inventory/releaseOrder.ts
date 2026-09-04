import type { ErpDatabase, OrderId } from '@/types'

export type ReleaseOrderContext = Pick<ErpDatabase, 'inventories' | 'serials' | 'reservations'>

export interface ReleaseOrderResult {
  ok: boolean
  /** 풀어줄 예약이 없다 — 이미 해제됐거나 애초에 예약되지 않은 주문 */
  failure?: 'NOT_RESERVED'
  inventories: ErpDatabase['inventories']
  serials: ErpDatabase['serials']
  reservations: ErpDatabase['reservations']
}

/**
 * 예약을 해제한다 (주문 취소·수량 변경).
 *
 * 해제 근거는 Reservation 기록이다. 04_재고현황의 예약수량만 보고 빼면 같은 품목을
 * 예약한 다른 주문의 몫까지 풀린다.
 * 기록을 지우면서 해제하므로 두 번 호출해도 두 번 빠지지 않는다.
 */
export const releaseOrder = (ctx: ReleaseOrderContext, orderId: OrderId): ReleaseOrderResult => {
  const reservation = ctx.reservations.find((candidate) => candidate.orderId === orderId)

  if (!reservation) {
    return {
      ok: false,
      failure: 'NOT_RESERVED',
      inventories: ctx.inventories,
      serials: ctx.serials,
      reservations: ctx.reservations,
    }
  }

  const inventories = ctx.inventories.map((inventory) => {
    if (inventory.warehouseCode !== reservation.warehouseCode) return inventory
    const line = reservation.lines.find((candidate) => candidate.itemCode === inventory.itemCode)
    if (!line) return inventory
    return {
      ...inventory,
      reservedQuantity: Math.max(0, inventory.reservedQuantity - line.quantity),
    }
  })

  const released = new Set(reservation.lines.flatMap((line) => line.serialNumbers))

  const serials = ctx.serials.map((serial) => {
    if (!released.has(serial.serialNumber)) return serial
    const { reservedOrderId: _released, ...rest } = serial
    return { ...rest, status: '창고 보관 중' as const }
  })

  return {
    ok: true,
    inventories,
    serials,
    reservations: ctx.reservations.filter((candidate) => candidate.orderId !== orderId),
  }
}
