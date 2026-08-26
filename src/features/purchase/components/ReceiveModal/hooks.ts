import { useMemo, useState } from 'react'
import { remainingQuantityOf } from '@/domain/purchase/receivePurchaseOrder'
import { masterRepository } from '@/data/repositories/inventoryRepository'
import { useErpStore } from '@/store/erpStore'
import type { PurchaseOrder, ReceiptLine } from '@/features/purchase/types'
import type { ReceiveLineRow } from './types'

/**
 * 입고 입력 폼 상태.
 *
 * 기본값은 전량 입고 — 실무에서 대부분 발주 잔량 그대로 들어온다.
 * 초기값을 useState 이니셜라이저로 잡으므로, 발주가 바뀔 때는 호출부가 key 로
 * 새로 마운트해야 한다 (effect 동기화는 연쇄 렌더를 만든다).
 */
export function useReceiveForm(purchaseOrder: PurchaseOrder) {
  const items = useErpStore((state) => state.items)

  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(purchaseOrder.lines.map((line) => [line.id, remainingQuantityOf(line)])),
  )

  const rows = useMemo<ReceiveLineRow[]>(() => {
    const itemMap = masterRepository.itemMap(items)

    return purchaseOrder.lines.map((line) => {
      const item = itemMap.get(line.itemId)
      return {
        lineId: line.id,
        itemName: item?.name ?? line.itemId,
        itemCode: item?.code ?? line.itemId,
        unit: item?.unit ?? 'EA',
        remaining: remainingQuantityOf(line),
      }
    })
  }, [items, purchaseOrder])

  /** 잔량을 넘는 입력은 잔량으로, 음수는 0 으로 잘라 넣는다 */
  const setQuantity = (lineId: string, value: number, remaining: number) => {
    const next = Number.isFinite(value) ? Math.max(0, value) : 0
    setQuantities((prev) => ({ ...prev, [lineId]: Math.min(next, remaining) }))
  }

  const receipts: ReceiptLine[] = rows.map((row) => ({
    lineId: row.lineId,
    quantity: quantities[row.lineId] ?? 0,
  }))

  return {
    rows,
    quantities,
    setQuantity,
    receipts,
    hasQuantity: receipts.some((receipt) => receipt.quantity > 0),
  }
}
