import type {
  ErpDatabase,
  ISODateString,
  Order,
  OrderPreparation,
  Reservation,
  ReservationLine,
  SerialInventory,
} from '@/types'
import { findItem, isSerialManaged } from '@/domain/master/itemRules'
import { canReserve } from '@/domain/preparation/preparationRules'
import { DUPLICATE_REQUEST, isProcessed, markProcessed } from '@/domain/request/idempotency'
import { pickSerials } from './pickSerials'

export type ReserveOrderContext = Pick<
  ErpDatabase,
  'items' | 'inventories' | 'serials' | 'reservations' | 'processedRequests'
>

export type ReserveFailure =
  /** 같은 요청 ID 가 이미 처리됐다 — 오류가 아니라 '이미 되어 있다' 는 뜻이다 */
  | typeof DUPLICATE_REQUEST
  /** 준비 판정이 READY 가 아니다 — 부분 예약은 하지 않는다 */
  | 'NOT_READY'
  /** 이미 이 주문의 예약이 있다 — 다른 요청 ID 로 들어온 중복 처리 */
  | 'ALREADY_RESERVED'
  /** 수량은 있는데 배정할 개체가 부족하다 — 재고현황과 개체재고가 어긋난 상태 */
  | 'SERIAL_SHORTAGE'

export interface ReserveOrderInput {
  order: Order
  preparation: OrderPreparation
  /** 예약 요청 ID — 같은 값으로 두 번 요청해도 예약수량은 한 번만 늘어난다 */
  requestId: string
  reservedAt: ISODateString
}

export interface ReserveOrderResult {
  ok: boolean
  failure?: ReserveFailure
  /** 실패하면 입력 그대로 돌려준다 — 호출부가 분기 없이 결과를 대입할 수 있다 */
  inventories: ErpDatabase['inventories']
  serials: ErpDatabase['serials']
  reservations: ErpDatabase['reservations']
  processedRequests: ErpDatabase['processedRequests']
  reservation?: Reservation
}

/**
 * 주문의 소요량을 예약한다.
 *
 * 전량 아니면 전무다 (00_안내: 한 주문은 필요한 모든 품목을 준비할 수 있을 때만 예약한다).
 * 그래서 준비 판정이 READY 가 아니면 아무것도 건드리지 않는다.
 *
 * 같은 주문을 두 번 처리해도 재고가 중복 차감되면 안 된다 (00_안내 마지막 규칙).
 * 근거는 두 겹이다.
 *   - 요청 ID: 같은 버튼을 두 번 눌렀거나 재시도한 경우
 *   - Reservation 기록: 다른 경로로 이미 예약된 주문인 경우
 * 04_재고현황의 예약수량만으로는 어느 주문의 몫인지 알 수 없어 둘 다 필요하다.
 *
 * 예약은 현재고를 줄이지 않는다. 물건은 아직 창고에 있고, 다른 주문이 쓰지 못하게
 * 잡아두는 것뿐이다. 실제 차감은 출고(shipOrder)에서 일어난다 (가이드 §25).
 */
export const reserveOrder = (
  ctx: ReserveOrderContext,
  { order, preparation, requestId, reservedAt }: ReserveOrderInput,
): ReserveOrderResult => {
  const unchanged = {
    inventories: ctx.inventories,
    serials: ctx.serials,
    reservations: ctx.reservations,
    processedRequests: ctx.processedRequests,
  }

  if (isProcessed(ctx.processedRequests, requestId)) {
    return { ok: false, failure: DUPLICATE_REQUEST, ...unchanged }
  }
  if (ctx.reservations.some((reservation) => reservation.orderId === order.orderId)) {
    return { ok: false, failure: 'ALREADY_RESERVED', ...unchanged }
  }
  if (!canReserve(preparation)) {
    return { ok: false, failure: 'NOT_READY', ...unchanged }
  }

  const lines: ReservationLine[] = []
  const assignedSerials = new Map<string, string>()

  for (const item of preparation.items) {
    const master = findItem(ctx.items, item.itemCode)
    let serialNumbers: string[] = []

    if (master && isSerialManaged(master)) {
      const picked = pickSerials(
        ctx.serials,
        item.itemCode,
        order.warehouseCode,
        item.requiredQuantity,
      )
      // 수량은 맞는데 개체가 모자라면 데이터가 어긋난 것이다. 절반만 반영하면 더 나빠진다.
      if (picked.length < item.requiredQuantity) {
        return { ok: false, failure: 'SERIAL_SHORTAGE', ...unchanged }
      }
      serialNumbers = picked.map((serial) => serial.serialNumber)
      serialNumbers.forEach((serialNumber) => assignedSerials.set(serialNumber, order.orderId))
    }

    lines.push({ itemCode: item.itemCode, quantity: item.requiredQuantity, serialNumbers })
  }

  const inventories = ctx.inventories.map((inventory) => {
    if (inventory.warehouseCode !== order.warehouseCode) return inventory
    const line = lines.find((candidate) => candidate.itemCode === inventory.itemCode)
    if (!line) return inventory
    return { ...inventory, reservedQuantity: inventory.reservedQuantity + line.quantity }
  })

  const serials: SerialInventory[] = ctx.serials.map((serial) => {
    const orderId = assignedSerials.get(serial.serialNumber)
    if (!orderId) return serial
    return { ...serial, status: '주문 배정됨', reservedOrderId: orderId }
  })

  const reservation: Reservation = {
    orderId: order.orderId,
    warehouseCode: order.warehouseCode,
    lines,
    reservedAt,
  }

  return {
    ok: true,
    inventories,
    serials,
    reservations: [...ctx.reservations, reservation],
    processedRequests: markProcessed(ctx.processedRequests, requestId, 'RESERVE', reservedAt),
    reservation,
  }
}
