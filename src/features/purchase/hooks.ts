import { useMemo } from 'react'
import { calculateDemand } from '@/domain/order/calculateDemand'
import { calculateShortage } from '@/domain/purchase/calculateShortage'
import { groupShortagesBySupplier } from '@/domain/purchase/createPurchaseOrder'
import { isDelayed } from '@/domain/purchase/receivePurchaseOrder'
import { masterRepository } from '@/data/repositories/inventoryRepository'
import { purchaseRepository } from '@/data/repositories/purchaseRepository'
import { useErpStore } from '@/store/erpStore'
import { today } from '@/utils/date'
import { ratio, sumBy } from '@/utils/number'
import type {
  PurchaseOrderRow,
  PurchasePlan,
  ShortageRow,
  UsePurchaseOrderRowsResult,
} from './types'

/**
 * 부족분 계산 결과를 화면용 행으로 만든다.
 *
 * 창고를 인자로 받는 이유: 수주의 출고 창고가 곧 발주 입고 창고이므로,
 * 창고를 섞어 계산하면 옮기지 못하는 재고를 있다고 착각한다.
 */
export function usePurchasePlan(warehouseId: string): PurchasePlan {
  const items = useErpStore((state) => state.items)
  const warehouses = useErpStore((state) => state.warehouses)
  const inventory = useErpStore((state) => state.inventory)
  const orders = useErpStore((state) => state.orders)
  const purchaseOrders = useErpStore((state) => state.purchaseOrders)

  return useMemo(() => {
    const itemMap = masterRepository.itemMap(items)
    const warehouseMap = masterRepository.warehouseMap(warehouses)

    const demand = calculateDemand({ items, orders, warehouseId })
    const shortages = calculateShortage({
      items,
      inventory,
      purchaseOrders,
      demand,
      warehouseId,
    })

    const rows = shortages.map<ShortageRow>((shortage) => {
      const item = itemMap.get(shortage.itemId)
      const unitPrice = item?.unitPrice ?? 0

      return {
        ...shortage,
        itemCode: item?.code ?? shortage.itemId,
        itemName: item?.name ?? '(미등록 품목)',
        unit: item?.unit ?? 'EA',
        supplier: item?.supplier ?? '미지정',
        unitPrice,
        leadTimeDays: item?.leadTimeDays ?? 0,
        warehouseName: warehouseMap.get(warehouseId)?.name ?? warehouseId,
        estimatedAmount: shortage.shortage * unitPrice,
      }
    })

    return {
      rows,
      supplierCount: groupShortagesBySupplier(items, shortages).length,
      totalAmount: sumBy(rows, (row) => row.estimatedAmount),
    }
  }, [items, warehouses, inventory, orders, purchaseOrders, warehouseId])
}

export function usePurchaseOrderRows(warehouseId: string | 'ALL'): UsePurchaseOrderRowsResult {
  const warehouses = useErpStore((state) => state.warehouses)
  const purchaseOrders = useErpStore((state) => state.purchaseOrders)

  return useMemo(() => {
    const warehouseMap = masterRepository.warehouseMap(warehouses)
    const baseDate = today()

    const rows = purchaseOrders
      .filter((purchaseOrder) => warehouseId === 'ALL' || purchaseOrder.warehouseId === warehouseId)
      .map<PurchaseOrderRow>((purchaseOrder) => {
        const totalQuantity = purchaseRepository.totalQuantity(purchaseOrder)
        const receivedQuantity = purchaseRepository.receivedQuantity(purchaseOrder)

        return {
          purchaseOrder,
          warehouseName:
            warehouseMap.get(purchaseOrder.warehouseId)?.name ?? purchaseOrder.warehouseId,
          totalQuantity,
          receivedQuantity,
          totalAmount: purchaseRepository.totalAmount(purchaseOrder),
          progress: ratio(receivedQuantity, totalQuantity),
          delayed: isDelayed(purchaseOrder, baseDate),
        }
      })

    return {
      rows,
      summary: {
        open: rows.filter((row) => row.progress < 1 && row.purchaseOrder.status !== 'CANCELLED')
          .length,
        delayed: rows.filter((row) => row.delayed).length,
        incomingQuantity: rows
          .filter((row) => row.purchaseOrder.status !== 'CANCELLED')
          .reduce((acc, row) => acc + (row.totalQuantity - row.receivedQuantity), 0),
      },
    }
  }, [purchaseOrders, warehouses, warehouseId])
}
