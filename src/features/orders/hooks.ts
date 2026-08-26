import { useMemo, useState } from 'react'
import { availableStockOf } from '@/domain/inventory/calculateAvailableStock'
import { calculateOrderDemand, toDemandMap } from '@/domain/order/calculateDemand'
import { canShip } from '@/domain/order/evaluateOrderStatus'
import { calculateIncoming } from '@/domain/purchase/calculateShortage'
import { masterRepository } from '@/data/repositories/inventoryRepository'
import { orderRepository } from '@/data/repositories/orderRepository'
import { useErpStore } from '@/store/erpStore'
import { isOverdue } from '@/utils/date'
import type {
  OrderComponentRow,
  OrderDetail,
  OrderFilter,
  OrderLineRow,
  OrderRow,
  UseOrderRowsResult,
} from './types'
import { EMPTY_ORDER_FILTER } from './utils'

export function useOrderRows(): UseOrderRowsResult {
  const warehouses = useErpStore((state) => state.warehouses)
  const orders = useErpStore((state) => state.orders)

  const [filter, setFilterState] = useState<OrderFilter>(EMPTY_ORDER_FILTER)

  const setFilter = (next: Partial<OrderFilter>) => setFilterState((prev) => ({ ...prev, ...next }))

  const rows = useMemo<OrderRow[]>(() => {
    const warehouseMap = masterRepository.warehouseMap(warehouses)

    return orderRepository.filter(orders, filter).map((order) => ({
      order,
      warehouseName: warehouseMap.get(order.warehouseId)?.name ?? order.warehouseId,
      totalAmount: orderRepository.totalAmount(order),
      totalQuantity: orderRepository.totalQuantity(order),
      overdue:
        order.status !== 'SHIPPED' && order.status !== 'CANCELLED' && isOverdue(order.dueDate),
      shippable: canShip(order),
    }))
  }, [orders, warehouses, filter])

  const summary = useMemo(
    () => ({
      total: rows.length,
      awaitingStock: rows.filter(
        (row) => row.order.status === 'CONFIRMED' || row.order.status === 'PARTIALLY_ALLOCATED',
      ).length,
      shippable: rows.filter((row) => row.shippable).length,
      overdue: rows.filter((row) => row.overdue).length,
    }),
    [rows],
  )

  return { rows, filter, setFilter, summary }
}

/**
 * 수주 1건을 라인과 구성품 단위로 펼친다.
 *
 * shortage 는 order.allocated 를 뺀 잔여 소요량에서 가용 재고를 다시 뺀 값이다.
 * 이미 예약을 확보한 몫은 부족으로 세지 않는다.
 */
export function useOrderDetail(orderId: string | null): OrderDetail | null {
  const items = useErpStore((state) => state.items)
  const warehouses = useErpStore((state) => state.warehouses)
  const orders = useErpStore((state) => state.orders)
  const inventory = useErpStore((state) => state.inventory)
  const purchaseOrders = useErpStore((state) => state.purchaseOrders)

  return useMemo(() => {
    if (!orderId) return null

    const order = orderRepository.find(orders, orderId)
    if (!order) return null

    const itemMap = masterRepository.itemMap(items)
    const warehouseMap = masterRepository.warehouseMap(warehouses)

    const lines = order.lines.map<OrderLineRow>((line) => {
      const item = itemMap.get(line.itemId)
      return {
        id: line.id,
        itemCode: item?.code ?? line.itemId,
        itemName: item?.name ?? '(미등록 품목)',
        itemType: item?.type ?? 'SINGLE',
        unit: item?.unit ?? 'EA',
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        amount: line.quantity * line.unitPrice,
      }
    })

    const heldMap = toDemandMap(order.allocated ?? [])

    const components = calculateOrderDemand(items, order).map<OrderComponentRow>((line) => {
      const item = itemMap.get(line.itemId)
      const allocated = Math.min(line.quantity, heldMap.get(line.itemId) ?? 0)
      const available = availableStockOf(inventory, line.itemId, order.warehouseId)

      return {
        itemId: line.itemId,
        itemCode: item?.code ?? line.itemId,
        itemName: item?.name ?? '(미등록 품목)',
        unit: item?.unit ?? 'EA',
        required: line.quantity,
        allocated,
        available,
        incoming: calculateIncoming(purchaseOrders, line.itemId, order.warehouseId),
        shortage: Math.max(0, line.quantity - allocated - available),
      }
    })

    return {
      order,
      warehouseName: warehouseMap.get(order.warehouseId)?.name ?? order.warehouseId,
      totalAmount: lines.reduce((acc, line) => acc + line.amount, 0),
      lines,
      components,
    }
  }, [orderId, orders, items, warehouses, inventory, purchaseOrders])
}
