import { useMemo, useState } from 'react'
import { masterRepository } from '@/data/repositories/inventoryRepository'
import { purchaseRepository } from '@/data/repositories/purchaseRepository'
import { usePurchaseOrderRows, usePurchasePlan } from '@/features/purchase/hooks'
import type { ReceiptLine } from '@/features/purchase/types'
import { useErpStore, type ActionResult } from '@/store/erpStore'
import { formatCompactWon, formatNumber } from '@/utils/number'
import type { UsePurchasePageResult } from './types'

export function usePurchasePage(): UsePurchasePageResult {
  const warehouses = useErpStore((state) => state.warehouses)
  const purchaseOrders = useErpStore((state) => state.purchaseOrders)
  const createPurchaseOrdersForShortage = useErpStore(
    (state) => state.createPurchaseOrdersForShortage,
  )
  const receivePurchase = useErpStore((state) => state.receivePurchase)

  const [warehouseId, setWarehouseId] = useState(() =>
    masterRepository.defaultWarehouseId(warehouses),
  )
  const [notice, setNotice] = useState<ActionResult | null>(null)
  const [receivingId, setReceivingId] = useState<string | null>(null)

  const plan = usePurchasePlan(warehouseId)
  const { rows: purchaseRows, summary } = usePurchaseOrderRows(warehouseId)

  const warehouseOptions = useMemo(
    () => warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name })),
    [warehouses],
  )

  const summaryItems = useMemo(
    () => [
      {
        label: '부족 품목',
        value: formatNumber(plan.rows.length),
        tone: plan.rows.length > 0 ? ('danger' as const) : ('default' as const),
      },
      {
        label: '예상 발주금액',
        value: formatCompactWon(plan.totalAmount),
        hint: `공급처 ${plan.supplierCount}곳`,
      },
      { label: '미완료 발주', value: formatNumber(summary.open) },
      {
        label: '입고 지연',
        value: formatNumber(summary.delayed),
        hint: `입고예정 잔량 ${formatNumber(summary.incomingQuantity)}`,
        tone: summary.delayed > 0 ? ('danger' as const) : ('default' as const),
      },
    ],
    [plan, summary],
  )

  const receivingOrder = receivingId
    ? (purchaseRepository.find(purchaseOrders, receivingId) ?? null)
    : null

  return {
    warehouseId,
    setWarehouseId,
    warehouseOptions,
    shortageRows: plan.rows,
    purchaseRows,
    summaryItems,
    notice,
    canCreatePurchaseOrders: plan.rows.length > 0,
    createPurchaseOrders: () => setNotice(createPurchaseOrdersForShortage(warehouseId)),
    receivingOrder,
    openReceive: setReceivingId,
    closeReceive: () => setReceivingId(null),
    receive: (receipts: ReceiptLine[]) => {
      if (!receivingId) return
      setNotice(receivePurchase(receivingId, receipts))
      setReceivingId(null)
    },
  }
}
