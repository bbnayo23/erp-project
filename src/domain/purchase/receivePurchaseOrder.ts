import type { InventoryDelta } from '@/features/inventory/types'
import type { PurchaseOrder, PurchaseOrderStatus, ReceiptLine } from '@/features/purchase/types'
import type { IsoDate } from '@/utils/date'

export interface ReceivePurchaseOrderInput {
  purchaseOrder: PurchaseOrder
  /** 라인별로 이번에 받은 수량 */
  receipts: readonly ReceiptLine[]
}

export interface ReceivePurchaseOrderResult {
  purchaseOrder: PurchaseOrder
  /** 창고 재고에 더할 변경량 — 예약(reserved)은 건드리지 않는다 */
  deltas: InventoryDelta[]
  /** 발주 잔량을 넘겨 받으려 한 라인 */
  violations: { lineId: string; requested: number; remaining: number }[]
}

const nextStatus = (purchaseOrder: PurchaseOrder): PurchaseOrderStatus => {
  const complete = purchaseOrder.lines.every((line) => line.receivedQuantity >= line.quantity)
  if (complete) return 'RECEIVED'
  const started = purchaseOrder.lines.some((line) => line.receivedQuantity > 0)
  return started ? 'PARTIALLY_RECEIVED' : purchaseOrder.status
}

/**
 * 입고 처리: 발주 라인의 누적 입고를 늘리고, 창고 실물 재고를 그만큼 올린다.
 *
 * 잔량을 넘는 입고는 반영하지 않고 violations 로 보고한다 — 초과 입고는
 * 발주서 수정이 필요한 사건이고, 조용히 받아주면 재고 신뢰도가 깨진다.
 * 입고는 예약을 만들지 않는다(reserved 불변) — 예약은 수주 확정의 결과다.
 */
export function receivePurchaseOrder({
  purchaseOrder,
  receipts,
}: ReceivePurchaseOrderInput): ReceivePurchaseOrderResult {
  const violations: ReceivePurchaseOrderResult['violations'] = []
  const applied = new Map<string, number>()

  for (const receipt of receipts) {
    if (receipt.quantity <= 0) continue

    const line = purchaseOrder.lines.find((candidate) => candidate.id === receipt.lineId)
    if (!line) {
      violations.push({ lineId: receipt.lineId, requested: receipt.quantity, remaining: 0 })
      continue
    }

    const remaining = line.quantity - line.receivedQuantity
    if (receipt.quantity > remaining) {
      violations.push({ lineId: receipt.lineId, requested: receipt.quantity, remaining })
      continue
    }

    applied.set(receipt.lineId, (applied.get(receipt.lineId) ?? 0) + receipt.quantity)
  }

  const nextLines = purchaseOrder.lines.map((line) => {
    const quantity = applied.get(line.id)
    if (!quantity) return line
    return { ...line, receivedQuantity: line.receivedQuantity + quantity }
  })

  const nextPurchaseOrder: PurchaseOrder = { ...purchaseOrder, lines: nextLines }

  const deltas: InventoryDelta[] = []
  for (const line of purchaseOrder.lines) {
    const quantity = applied.get(line.id)
    if (!quantity) continue
    deltas.push({
      itemId: line.itemId,
      warehouseId: purchaseOrder.warehouseId,
      onHand: quantity,
    })
  }

  return {
    purchaseOrder: { ...nextPurchaseOrder, status: nextStatus(nextPurchaseOrder) },
    deltas,
    violations,
  }
}

/** 남은 입고 수량 (라인 단위) */
export const remainingQuantityOf = (line: { quantity: number; receivedQuantity: number }) =>
  Math.max(0, line.quantity - line.receivedQuantity)

/** 입고 예정일이 지났는데 잔량이 남았는가 */
export function isDelayed(purchaseOrder: PurchaseOrder, baseDate: IsoDate): boolean {
  if (purchaseOrder.status === 'RECEIVED' || purchaseOrder.status === 'CANCELLED') return false
  return purchaseOrder.expectedDate < baseDate
}
