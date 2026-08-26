import type { Item } from '@/features/inventory/types'
import type { PurchaseOrder, PurchaseOrderLine, ShortageLine } from '@/features/purchase/types'
import { addDays, type IsoDate } from '@/utils/date'

export interface CreatePurchaseOrderInput {
  id: string
  code: string
  supplier: string
  warehouseId: string
  orderedAt: IsoDate
  items: readonly Item[]
  shortages: readonly ShortageLine[]
}

/**
 * 부족분을 발주 1건으로 만든다.
 *
 * 입고 예정일은 라인 중 가장 긴 리드타임으로 잡는다 — 한 건이라도 늦으면
 * 그 발주는 그 날에야 완결된다.
 * id/code/orderedAt 을 주입받는 이유: 순수 함수로 두면 테스트가 결정적이 된다.
 */
export function createPurchaseOrder({
  id,
  code,
  supplier,
  warehouseId,
  orderedAt,
  items,
  shortages,
}: CreatePurchaseOrderInput): PurchaseOrder | null {
  const byId = new Map(items.map((item) => [item.id, item]))

  const lines: PurchaseOrderLine[] = shortages
    .filter((shortage) => shortage.shortage > 0)
    .map((shortage, index) => {
      const item = byId.get(shortage.itemId)
      return {
        id: `${id}-L${index + 1}`,
        itemId: shortage.itemId,
        quantity: shortage.shortage,
        receivedQuantity: 0,
        unitPrice: item?.unitPrice ?? 0,
      }
    })

  if (lines.length === 0) return null

  const maxLeadTime = lines.reduce(
    (acc, line) => Math.max(acc, byId.get(line.itemId)?.leadTimeDays ?? 0),
    0,
  )

  return {
    id,
    code,
    supplier,
    warehouseId,
    orderedAt,
    expectedDate: addDays(orderedAt, maxLeadTime),
    status: 'ORDERED',
    lines,
  }
}

/**
 * 부족분을 공급처별로 묶는다.
 * 한 공급처에 여러 품목을 한 건으로 몰아야 발주 건수와 배송비가 줄어든다.
 */
export function groupShortagesBySupplier(
  items: readonly Item[],
  shortages: readonly ShortageLine[],
): { supplier: string; shortages: ShortageLine[] }[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  const groups = new Map<string, ShortageLine[]>()

  for (const shortage of shortages) {
    const supplier = byId.get(shortage.itemId)?.supplier ?? '미지정'
    const bucket = groups.get(supplier)
    if (bucket) bucket.push(shortage)
    else groups.set(supplier, [shortage])
  }

  return [...groups].map(([supplier, group]) => ({ supplier, shortages: group }))
}
