import { useMemo, useState } from 'react'
import { useOrderDetail, useOrderRows } from '@/features/orders/hooks'
import { ORDER_STATUS, ORDER_STATUS_ORDER } from '@/features/orders/utils'
import { useErpStore, type ActionResult } from '@/store/erpStore'
import { formatNumber } from '@/utils/number'
import type { UseOrdersPageResult } from './types'

export function useOrdersPage(): UseOrdersPageResult {
  const warehouses = useErpStore((state) => state.warehouses)
  const confirmOrder = useErpStore((state) => state.confirmOrder)
  const shipOrder = useErpStore((state) => state.shipOrder)
  const cancelOrder = useErpStore((state) => state.cancelOrder)
  const resetStore = useErpStore((state) => state.reset)

  const { rows, filter, setFilter, summary } = useOrderRows()
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [notice, setNotice] = useState<ActionResult | null>(null)

  const detail = useOrderDetail(selectedOrderId)

  const statusOptions = useMemo(
    () => [
      { value: 'ALL', label: '전체 상태' },
      ...ORDER_STATUS_ORDER.map((status) => ({ value: status, label: ORDER_STATUS[status].label })),
    ],
    [],
  )

  const warehouseOptions = useMemo(
    () => [
      { value: 'ALL', label: '전체 창고' },
      ...warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name })),
    ],
    [warehouses],
  )

  const summaryItems = useMemo(
    () => [
      { label: '수주', value: formatNumber(summary.total), hint: '필터 적용 기준' },
      {
        label: '재고 대기',
        value: formatNumber(summary.awaitingStock),
        hint: '확정 · 부분예약',
        tone: summary.awaitingStock > 0 ? ('warning' as const) : ('default' as const),
      },
      { label: '출하 가능', value: formatNumber(summary.shippable) },
      {
        label: '납기 초과',
        value: formatNumber(summary.overdue),
        tone: summary.overdue > 0 ? ('danger' as const) : ('default' as const),
      },
    ],
    [summary],
  )

  return {
    rows,
    filter,
    setFilter,
    statusOptions,
    warehouseOptions,
    summaryItems,
    detail,
    selectedOrderId,
    select: setSelectedOrderId,
    closeDetail: () => setSelectedOrderId(null),
    notice,
    confirm: (orderId) => setNotice(confirmOrder(orderId)),
    ship: (orderId) => setNotice(shipOrder(orderId)),
    cancel: (orderId) => setNotice(cancelOrder(orderId)),
    reset: () => {
      resetStore()
      setSelectedOrderId(null)
      setNotice({ ok: true, message: '시드 데이터로 되돌렸습니다.' })
    },
  }
}
