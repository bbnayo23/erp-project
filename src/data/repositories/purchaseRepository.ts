import type { PurchaseOrder } from '@/features/purchase/types'
import { sumBy } from '@/utils/number'

const CODE_PREFIX = 'PO-2026-'

/** 'PO-2026-0603' → 603. 접두사가 다르면 0 을 돌려 번호 계산에서 빠진다. */
function sequenceOf(code: string, prefix: string): number {
  if (!code.startsWith(prefix)) return 0
  const parsed = Number(code.slice(prefix.length).replace(/\D/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export const purchaseRepository = {
  find(purchaseOrders: readonly PurchaseOrder[], purchaseOrderId: string) {
    return purchaseOrders.find((purchaseOrder) => purchaseOrder.id === purchaseOrderId)
  },

  replace(purchaseOrders: readonly PurchaseOrder[], next: PurchaseOrder): PurchaseOrder[] {
    return purchaseOrders.map((purchaseOrder) =>
      purchaseOrder.id === next.id ? next : purchaseOrder,
    )
  },

  add(purchaseOrders: readonly PurchaseOrder[], next: PurchaseOrder): PurchaseOrder[] {
    return [next, ...purchaseOrders]
  },

  /**
   * 신규 발주 N 건의 id/code 를 한 번에 만든다.
   * 공급처별로 여러 건이 동시에 생성되므로 번호가 겹치지 않게 순차로 뽑아둔다.
   */
  nextIdentities(
    purchaseOrders: readonly PurchaseOrder[],
    count: number,
  ): { id: string; code: string }[] {
    const start =
      purchaseOrders
        .map((purchaseOrder) => sequenceOf(purchaseOrder.code, CODE_PREFIX))
        .reduce((acc, value) => Math.max(acc, value), 0) + 1

    return Array.from({ length: Math.max(0, count) }, (_, index) => {
      const seq = String(start + index).padStart(4, '0')
      return { id: `PO-26${seq}`, code: `${CODE_PREFIX}${seq}` }
    })
  },

  totalQuantity(purchaseOrder: PurchaseOrder): number {
    return sumBy(purchaseOrder.lines, (line) => line.quantity)
  },

  receivedQuantity(purchaseOrder: PurchaseOrder): number {
    return sumBy(purchaseOrder.lines, (line) => line.receivedQuantity)
  },

  totalAmount(purchaseOrder: PurchaseOrder): number {
    return sumBy(purchaseOrder.lines, (line) => line.quantity * line.unitPrice)
  },
}
