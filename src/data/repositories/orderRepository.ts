import type { Order, OrderId } from '@/types'

export const orderRepository = {
  find(orders: readonly Order[], orderId: OrderId): Order | undefined {
    return orders.find((order) => order.orderId === orderId)
  },

  replace(orders: readonly Order[], next: Order): Order[] {
    return orders.map((order) => (order.orderId === next.orderId ? next : order))
  },

  /** 06_주문 정상 품목 수량 합계 — 취소 품목은 세지 않는다 */
  normalQuantity(order: Order): number {
    return order.items
      .filter((item) => item.status === '정상')
      .reduce((acc, item) => acc + item.quantity, 0)
  },
}
