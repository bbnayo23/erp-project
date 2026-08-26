import type { BundleComponent, DemandLine, Item, ItemCode, Quantity } from '@/types'
import { findItem, isBundleItem, isServiceItem } from '@/domain/master/itemRules'

/** 세트가 자기 자신을 (간접적으로라도) 품으면 전개가 무한히 돈다 */
const MAX_DEPTH = 10

export interface ExpandBundleResult {
  /** 전개 결과 — 재고를 갖는 실물 품목만 남는다 */
  lines: DemandLine[]
  /** 01_품목에 없는 품목코드 (UNKNOWN-SKU) */
  unknownItemCodes: ItemCode[]
  /** 재고 수요에서 제외된 품목 — 서비스, 또는 출고대상여부가 아니오인 구성품 */
  excludedItemCodes: ItemCode[]
  /** 순환 참조로 전개를 중단한 세트 품목 */
  cyclicItemCodes: ItemCode[]
}

interface Accumulator {
  totals: Map<ItemCode, Quantity>
  unknown: Set<ItemCode>
  excluded: Set<ItemCode>
  cyclic: Set<ItemCode>
}

function walk(
  items: readonly Item[],
  bundleComponents: readonly BundleComponent[],
  itemCode: ItemCode,
  quantity: Quantity,
  trail: readonly ItemCode[],
  acc: Accumulator,
): void {
  const item = findItem(items, itemCode)

  if (!item) {
    // 미등록 품목은 조용히 버리지 않는다 — 버리면 준비 가능한 주문처럼 보인다
    acc.unknown.add(itemCode)
    return
  }

  if (isServiceItem(item)) {
    acc.excluded.add(itemCode)
    return
  }

  if (!isBundleItem(item)) {
    acc.totals.set(itemCode, (acc.totals.get(itemCode) ?? 0) + quantity)
    return
  }

  if (trail.includes(itemCode) || trail.length >= MAX_DEPTH) {
    acc.cyclic.add(itemCode)
    return
  }

  const components = bundleComponents.filter((component) => component.bundleItemCode === itemCode)

  for (const component of components) {
    if (!component.isOutboundTarget) {
      acc.excluded.add(component.componentItemCode)
      continue
    }
    walk(
      items,
      bundleComponents,
      component.componentItemCode,
      quantity * component.quantity,
      [...trail, itemCode],
      acc,
    )
  }
}

const toResult = (acc: Accumulator): ExpandBundleResult => ({
  lines: [...acc.totals].map(([itemCode, quantity]) => ({ itemCode, quantity })),
  unknownItemCodes: [...acc.unknown],
  excludedItemCodes: [...acc.excluded],
  cyclicItemCodes: [...acc.cyclic],
})

const emptyAccumulator = (): Accumulator => ({
  totals: new Map(),
  unknown: new Set(),
  excluded: new Set(),
  cyclic: new Set(),
})

/**
 * 세트상품을 실물 품목 소요량으로 전개한다.
 *
 * 세트 안에 세트가 들어올 수 있어 재귀로 내려간다. 같은 실물 품목이 여러 경로로
 * 나오면 합산한다 — 재고 예약은 품목 단위로 일어난다.
 */
export function expandBundle(
  items: readonly Item[],
  bundleComponents: readonly BundleComponent[],
  itemCode: ItemCode,
  quantity: Quantity,
): ExpandBundleResult {
  const acc = emptyAccumulator()
  walk(items, bundleComponents, itemCode, quantity, [], acc)
  return toResult(acc)
}

/** 여러 라인을 한 번에 전개하고 품목 단위로 합산한다 */
export function expandBundleLines(
  items: readonly Item[],
  bundleComponents: readonly BundleComponent[],
  lines: readonly DemandLine[],
): ExpandBundleResult {
  const acc = emptyAccumulator()
  for (const line of lines) {
    walk(items, bundleComponents, line.itemCode, line.quantity, [], acc)
  }
  return toResult(acc)
}
