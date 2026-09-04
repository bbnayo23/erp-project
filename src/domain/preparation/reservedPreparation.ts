import type { OrderPreparation, PreparationItem, Reservation } from '@/types'

/**
 * 이미 예약된 주문의 준비 판정.
 *
 * 예약을 마친 주문은 배정 경쟁에서 빠져야 한다. 예약수량은 이미 04_재고현황에 올라가
 * 다른 주문의 가용재고에서 빠져 있으므로, 물량은 이 주문 몫으로 확보된 상태다.
 *
 * 그런데 이 주문을 다시 원장에 넣고 판정하면 자기 예약 때문에 자기가 부족해진다.
 * 현재고 5 중 3을 예약하면 가용은 2인데 소요는 여전히 3으로 잡혀 SHORTAGE 가 되고,
 * 있는 재고를 두고 발주가 나간다.
 *
 * 그래서 예약 기록이 있으면 원장을 건드리지 않고 그 기록을 그대로 판정으로 옮긴다.
 * 소요량·배정량은 예약된 수량이고, 부족분은 없다.
 */
export const preparationFromReservation = (reservation: Reservation): OrderPreparation => {
  const items = reservation.lines.map<PreparationItem>((line) => ({
    itemCode: line.itemCode,
    requiredQuantity: line.quantity,
    // 예약으로 확보된 물량이다. 창고의 잔여 가용재고가 아니다.
    availableQuantity: line.quantity,
    incomingQuantity: 0,
    allocatedFromStock: line.quantity,
    allocatedFromIncoming: 0,
    shortageQuantity: 0,
    status: 'READY',
    incomingDocumentIds: [],
  }))

  return {
    orderId: reservation.orderId,
    status: 'READY',
    items,
    // 서비스 제외 내역은 예약 기록에 남지 않는다. 상세 화면은 주문에서 다시 계산한다.
    excludedItemCodes: [],
    blockingReasons: [],
  }
}

export const findReservation = (
  reservations: readonly Reservation[],
  orderId: string,
): Reservation | undefined => reservations.find((reservation) => reservation.orderId === orderId)
