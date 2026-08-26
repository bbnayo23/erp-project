import type { SupplierCode } from './common'

/** 08_공급처 구분 — 구매처는 발주(PO), 생산처는 생산의뢰(MO) 대상이다 */
export type SupplierType = '구매처' | '생산처'

export interface Supplier {
  supplierCode: SupplierCode
  supplierName: string
  type: SupplierType
  /** 발주일로부터 사용가능예정일까지의 일수 */
  leadTimeDays: number
}
