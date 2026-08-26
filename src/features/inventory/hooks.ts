import { useMemo, useState } from 'react'
import { calculateAvailableStock } from '@/domain/inventory/calculateAvailableStock'
import { calculateDemand, toDemandMap } from '@/domain/order/calculateDemand'
import { calculateIncoming } from '@/domain/purchase/calculateShortage'
import { masterRepository } from '@/data/repositories/inventoryRepository'
import { useErpStore } from '@/store/erpStore'
import type { InventoryFilter, InventoryRow, UseInventoryRowsResult } from './types'
import { EMPTY_INVENTORY_FILTER, resolveStockLevel } from './utils'

/**
 * 재고 레코드에 소요량·입고예정을 붙여 화면용 행으로 만든다.
 *
 * 소요량은 창고별로 따로 계산한다 — 수주는 출고 창고가 정해져 있고,
 * 다른 창고 수요를 섞으면 부족분이 실제보다 커진다.
 */
export function useInventoryRows(): UseInventoryRowsResult {
  const items = useErpStore((state) => state.items)
  const warehouses = useErpStore((state) => state.warehouses)
  const inventory = useErpStore((state) => state.inventory)
  const orders = useErpStore((state) => state.orders)
  const purchaseOrders = useErpStore((state) => state.purchaseOrders)

  const [filter, setFilterState] = useState<InventoryFilter>(EMPTY_INVENTORY_FILTER)

  const setFilter = (next: Partial<InventoryFilter>) =>
    setFilterState((prev) => ({ ...prev, ...next }))

  const allRows = useMemo<InventoryRow[]>(() => {
    const itemMap = masterRepository.itemMap(items)
    const warehouseMap = masterRepository.warehouseMap(warehouses)

    // 창고별 소요량 맵을 한 번만 만들어 재사용한다
    const demandByWarehouse = new Map(
      warehouses.map((warehouse) => [
        warehouse.id,
        toDemandMap(calculateDemand({ items, orders, warehouseId: warehouse.id })),
      ]),
    )

    return inventory.map((record) => {
      const item = itemMap.get(record.itemId)
      const available = calculateAvailableStock(record)
      const safetyStock = item?.safetyStock ?? 0

      return {
        itemId: record.itemId,
        itemCode: item?.code ?? record.itemId,
        itemName: item?.name ?? '(미등록 품목)',
        itemType: item?.type ?? 'SINGLE',
        unit: item?.unit ?? 'EA',
        warehouseId: record.warehouseId,
        warehouseName: warehouseMap.get(record.warehouseId)?.name ?? record.warehouseId,
        onHand: record.onHand,
        reserved: record.reserved,
        available,
        safetyStock,
        demand: demandByWarehouse.get(record.warehouseId)?.get(record.itemId) ?? 0,
        incoming: calculateIncoming(purchaseOrders, record.itemId, record.warehouseId),
        level: resolveStockLevel(available, safetyStock),
        updatedAt: record.updatedAt,
      }
    })
  }, [items, warehouses, inventory, orders, purchaseOrders])

  const rows = useMemo(() => {
    const keyword = filter.keyword.trim().toLowerCase()

    return allRows.filter((row) => {
      if (filter.warehouseId !== 'ALL' && row.warehouseId !== filter.warehouseId) return false
      if (filter.onlyRisk && row.level === 'HEALTHY') return false
      if (!keyword) return true
      return (
        row.itemCode.toLowerCase().includes(keyword) || row.itemName.toLowerCase().includes(keyword)
      )
    })
  }, [allRows, filter])

  const summary = useMemo(
    () => ({
      total: rows.length,
      outOfStock: rows.filter((row) => row.level === 'OUT_OF_STOCK').length,
      belowSafety: rows.filter((row) => row.level === 'BELOW_SAFETY').length,
      uncovered: rows.filter((row) => row.demand > row.available + row.incoming).length,
    }),
    [rows],
  )

  return { rows, filter, setFilter, summary }
}
