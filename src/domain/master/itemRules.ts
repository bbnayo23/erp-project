import type { Item, ItemCode } from '@/types'

/** 01_품목에서 품목을 찾는다. 없으면 undefined — UNKNOWN-SKU 가 실제로 존재한다. */
export const findItem = (items: readonly Item[], itemCode: ItemCode): Item | undefined =>
  items.find((item) => item.itemCode === itemCode)

export const itemMap = (items: readonly Item[]): Map<ItemCode, Item> =>
  new Map(items.map((item) => [item.itemCode, item]))

/** 설치·수거 같은 서비스 — 재고 수요에서 제외한다 (00_안내) */
export const isServiceItem = (item: Item): boolean => item.itemType === '서비스'

/** 세트상품 — 자기 자신은 재고를 갖지 않고 구성품으로 풀린다 */
export const isBundleItem = (item: Item): boolean => item.itemType === '세트상품'

/** 실제로 창고에 쌓이는 품목 (생산품·매입품) */
export const isStockItem = (item: Item): boolean => !isServiceItem(item) && !isBundleItem(item)

/** 개체 단위로 관리되는 품목 — 매트리스·프레임 */
export const isSerialManaged = (item: Item): boolean => item.serialManaged
