import type { ItemCode, Quantity, SerialInventory, SerialNumber } from '@/types'

/**
 * 05_개체재고 시리얼번호 규칙: UNIT-토큰-0001 (UNIT-Z10-Q-0001, UNIT-DMN-K-0002)
 * 토큰은 품목코드의 분류 접두사를 뗀 부분이다 — MAT-Z10-Q → Z10-Q.
 */
const prefixOf = (itemCode: ItemCode): string => `UNIT-${itemCode.split('-').slice(1).join('-')}-`

export const serialRepository = {
  find(serials: readonly SerialInventory[], serialNumber: SerialNumber) {
    return serials.find((serial) => serial.serialNumber === serialNumber)
  },

  /**
   * 입고할 개체에 붙일 번호를 만든다.
   * 기존 번호에서 최댓값을 이어받으므로 같은 데이터에서 항상 같은 번호가 나온다.
   */
  nextSerialNumbers(
    serials: readonly SerialInventory[],
    itemCode: ItemCode,
    quantity: Quantity,
  ): SerialNumber[] {
    const prefix = prefixOf(itemCode)

    const max = serials
      .filter((serial) => serial.serialNumber.startsWith(prefix))
      .map((serial) => Number(serial.serialNumber.slice(prefix.length)))
      .filter((value) => Number.isFinite(value))
      .reduce((acc, value) => Math.max(acc, value), 0)

    return Array.from(
      { length: Math.max(0, quantity) },
      (_, index) => `${prefix}${String(max + index + 1).padStart(4, '0')}`,
    )
  },
}
