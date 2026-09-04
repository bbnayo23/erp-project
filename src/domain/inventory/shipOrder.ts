import type { ErpDatabase, ISODateString, Order, OrderStatus, Shipment } from '@/types'
import { DUPLICATE_REQUEST, isProcessed, markProcessed } from '@/domain/request/idempotency'

export type ShipOrderContext = Pick<
  ErpDatabase,
  'inventories' | 'serials' | 'reservations' | 'orders' | 'shipments' | 'processedRequests'
>

export type ShipFailure =
  /** 같은 요청 ID 가 이미 처리됐다 */
  | typeof DUPLICATE_REQUEST
  /** 예약이 없으면 출고할 수 없다 — 예약을 건너뛴 출고는 재고를 신뢰할 수 없게 만든다 */
  | 'NOT_RESERVED'
  | 'ALREADY_SHIPPED'

export interface ShipOrderInput {
  order: Order
  /** 출고 요청 ID — 같은 값으로 두 번 요청해도 현재고는 한 번만 줄어든다 */
  requestId: string
  shippedAt: ISODateString
}

export interface ShipOrderResult {
  ok: boolean
  failure?: ShipFailure
  inventories: ErpDatabase['inventories']
  serials: ErpDatabase['serials']
  reservations: ErpDatabase['reservations']
  orders: ErpDatabase['orders']
  shipments: ErpDatabase['shipments']
  processedRequests: ErpDatabase['processedRequests']
  shipment?: Shipment
}

const SHIPPED: OrderStatus = '출고 완료'

/**
 * 출고 처리 — 예약된 만큼 현재고와 예약수량을 함께 줄인다.
 *
 * 예약분만 내보낸다. 소요량을 다시 계산해 내보내면 예약을 넘어선 출고가 가능해진다.
 * 개체는 '주문 배정됨' → '출고 완료' 로 넘어가고 창고를 떠나므로 현재고에서 빠진다.
 *
 * 세 가지가 한 번에 일어난다 (가이드 §25): 현재고 감소, 예약수량 감소, 출고 이력 생성.
 * 하나라도 빠지면 숫자가 어긋나므로 호출부는 이 결과를 통째로 대입해야 한다.
 *
 * 중복 출고는 세 겹으로 막는다 — 요청 ID, 주문상태, 예약 기록의 소비.
 * 예약을 소비하면서 처리하므로 요청 ID 가 달라도 두 번째 출고는 NOT_RESERVED 가 된다.
 */
export const shipOrder = (
  ctx: ShipOrderContext,
  { order, requestId, shippedAt }: ShipOrderInput,
): ShipOrderResult => {
  const unchanged = {
    inventories: ctx.inventories,
    serials: ctx.serials,
    reservations: ctx.reservations,
    orders: ctx.orders,
    shipments: ctx.shipments,
    processedRequests: ctx.processedRequests,
  }

  if (isProcessed(ctx.processedRequests, requestId)) {
    return { ok: false, failure: DUPLICATE_REQUEST, ...unchanged }
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

  // 예약은 여기서 사라진다. 무엇을 어느 개체로 내보냈는지는 이 이력에만 남는다.
  const shipment: Shipment = {
    shipmentId: requestId,
    orderId: order.orderId,
    warehouseCode: reservation.warehouseCode,
    lines: reservation.lines.map((line) => ({
      itemCode: line.itemCode,
      quantity: line.quantity,
      serialNumbers: [...line.serialNumbers],
    })),
    shippedAt,
  }

  return {
    ok: true,
    inventories,
    serials,
    reservations: ctx.reservations.filter((candidate) => candidate.orderId !== order.orderId),
    orders: ctx.orders.map((candidate) =>
      candidate.orderId === order.orderId ? { ...candidate, status: SHIPPED } : candidate,
    ),
    shipments: [...ctx.shipments, shipment],
    processedRequests: markProcessed(ctx.processedRequests, requestId, 'SHIP', shippedAt),
    shipment,
  }
}
