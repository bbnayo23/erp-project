import type { Inventory, ItemCode, Quantity, WarehouseCode } from '@/types'

/**
 * 가용재고 = 현재고 - 예약수량 (00_안내 첫 번째 규칙).
 *
 * 저장하지 않고 매번 계산한다. 현재고나 예약수량만 바꾸고 가용재고 갱신을 잊는
 * 실수가 구조적으로 불가능해야 한다.
 */
export const getAvailableQuantity = (inventory: Inventory | undefined): Quantity => {
  if (!inventory) return 0
  return Math.max(0, inventory.currentQuantity - inventory.reservedQuantity)
}

export const findInventory = (
  inventories: readonly Inventory[],
  itemCode: ItemCode,
  warehouseCode: WarehouseCode,
): Inventory | undefined =>
  inventories.find(
    (inventory) => inventory.itemCode === itemCode && inventory.warehouseCode === warehouseCode,
  )

export const availableQuantityOf = (
  inventories: readonly Inventory[],
  itemCode: ItemCode,
  warehouseCode: WarehouseCode,
): Quantity => getAvailableQuantity(findInventory(inventories, itemCode, warehouseCode))
