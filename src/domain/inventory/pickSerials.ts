import type { ItemCode, Quantity, SerialInventory, WarehouseCode } from '@/types'
import { compareIso } from '@/utils/date'

/**
 * 배정할 개체를 고른다.
 *
 * 먼저 입고된 것부터 (FIFO) — 매트리스는 오래 보관하면 상태가 떨어진다.
 * 입고일시가 같으면 시리얼번호로 갈라 결과를 결정적으로 만든다. 그래야 같은 입력에
 * 같은 배정이 나오고 테스트가 안정적이다.
 */
export function pickSerials(
  serials: readonly SerialInventory[],
  itemCode: ItemCode,
  warehouseCode: WarehouseCode,
  quantity: Quantity,
): SerialInventory[] {
  return serials
    .filter(
      (serial) =>
        serial.itemCode === itemCode &&
        serial.warehouseCode === warehouseCode &&
        serial.status === '창고 보관 중',
    )
    .sort(
      (a, b) =>
        compareIso(a.receivedAt, b.receivedAt) || a.serialNumber.localeCompare(b.serialNumber),
    )
    .slice(0, quantity)
}

/** 특정 주문에 배정된 개체들 */
export const serialsOfOrder = (
  serials: readonly SerialInventory[],
  orderId: string,
): SerialInventory[] => serials.filter((serial) => serial.reservedOrderId === orderId)
