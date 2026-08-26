import type { Item } from '@/features/inventory/types'
import type { DemandLine } from '@/features/orders/types'

/** 번들이 자기 자신을 (간접적으로라도) 포함하면 전개가 무한히 돈다 */
const MAX_DEPTH = 10

export interface ExpandBundleResult {
  /** 전개 결과 — SINGLE 품목만 남는다 */
  lines: DemandLine[]
  /** 순환 참조로 전개를 중단한 번들 품목 id */
  cyclicItemIds: string[]
}

/**
 * 번들 품목을 실물(SINGLE) 품목 소요량으로 전개한다.
 *
 * 번들 안에 번들이 들어올 수 있어 재귀로 내려간다. 같은 실물 품목이 여러 경로로
 * 나오면 하나로 합산한다 — 재고 예약은 품목 단위로 일어나기 때문이다.
 */
export function expandBundle(
  items: readonly Item[],
  itemId: string,
  quantity: number,
): ExpandBundleResult {
  const byId = new Map(items.map((item) => [item.id, item]))
  const totals = new Map<string, number>()
  const cyclic = new Set<string>()

  const walk = (currentId: string, currentQuantity: number, trail: readonly string[]) => {
    const item = byId.get(currentId)

    // 미등록 품목은 실물로 간주한다 — 소요량을 조용히 버리면 부족분이 감춰진다
    if (!item || item.type === 'SINGLE' || !item.components?.length) {
      totals.set(currentId, (totals.get(currentId) ?? 0) + currentQuantity)
      return
    }

    if (trail.includes(currentId) || trail.length >= MAX_DEPTH) {
      cyclic.add(currentId)
      return
    }

    for (const component of item.components) {
      walk(component.itemId, currentQuantity * component.quantity, [...trail, currentId])
    }
  }

  walk(itemId, quantity, [])

  return {
    lines: [...totals].map(([id, qty]) => ({ itemId: id, quantity: qty })),
    cyclicItemIds: [...cyclic],
  }
}

/** 여러 라인을 한 번에 전개하고 품목 단위로 합산한다 */
export function expandBundleLines(
  items: readonly Item[],
  lines: readonly DemandLine[],
): ExpandBundleResult {
  const totals = new Map<string, number>()
  const cyclic = new Set<string>()

  for (const line of lines) {
    const result = expandBundle(items, line.itemId, line.quantity)
    for (const expanded of result.lines) {
      totals.set(expanded.itemId, (totals.get(expanded.itemId) ?? 0) + expanded.quantity)
    }
    result.cyclicItemIds.forEach((id) => cyclic.add(id))
  }

  return {
    lines: [...totals].map(([itemId, quantity]) => ({ itemId, quantity })),
    cyclicItemIds: [...cyclic],
  }
}
