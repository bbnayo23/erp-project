import type { Warehouse, WarehouseCode } from '@/types'

export const findWarehouse = (
  warehouses: readonly Warehouse[],
  warehouseCode: WarehouseCode,
): Warehouse | undefined =>
  warehouses.find((warehouse) => warehouse.warehouseCode === warehouseCode)

export const warehouseMap = (warehouses: readonly Warehouse[]): Map<WarehouseCode, Warehouse> =>
  new Map(warehouses.map((warehouse) => [warehouse.warehouseCode, warehouse]))

/**
 * 운영 중인 창고인가.
 * WH-LEGACY 는 재고와 개체가 남아 있지만 사용 중지라 출고 준비 대상이 아니다.
 */
export const isActiveWarehouse = (warehouse: Warehouse): boolean => warehouse.status === '사용 중'

export const activeWarehouses = (warehouses: readonly Warehouse[]): Warehouse[] =>
  warehouses.filter(isActiveWarehouse)
