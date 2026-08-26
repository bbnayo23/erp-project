import type { Order, OrderFilter } from '@/features/orders/types'
import { sumBy } from '@/utils/number'

export const orderRepository = {
  find(orders: readonly Order[], orderId: string): Order | undefined {
    return orders.find((order) => order.id === orderId)
  },

  replace(orders: readonly Order[], next: Order): Order[] {
    return orders.map((order) => (order.id === next.id ? next : order))
  },

  /** 키워드는 수주번호·고객명 양쪽을 본다 — 실무에서 둘 다로 찾는다 */
  filter(orders: readonly Order[], filter: OrderFilter): Order[] {
    const keyword = filter.keyword.trim().toLowerCase()

    return orders.filter((order) => {
      if (filter.status !== 'ALL' && order.status !== filter.status) return false
      if (filter.warehouseId !== 'ALL' && order.warehouseId !== filter.warehouseId) return false
      if (!keyword) return true
      return (
        order.code.toLowerCase().includes(keyword) ||
        order.customerName.toLowerCase().includes(keyword)
      )
    })
  },

  totalAmount(order: Order): number {
    return sumBy(order.lines, (line) => line.quantity * line.unitPrice)
  },

  totalQuantity(order: Order): number {
    return sumBy(order.lines, (line) => line.quantity)
  },
}
