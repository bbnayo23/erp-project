import type { WarehouseCode } from './common'

/** 03_창고 운영상태 */
export type WarehouseStatus = '사용 중' | '사용 중지'

export interface Warehouse {
  warehouseCode: WarehouseCode
  warehouseName: string
  status: WarehouseStatus
}
