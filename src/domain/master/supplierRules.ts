import type { Supplier, SupplierCode } from '@/types'

export const findSupplier = (
  suppliers: readonly Supplier[],
  supplierCode: SupplierCode,
): Supplier | undefined => suppliers.find((supplier) => supplier.supplierCode === supplierCode)

export const supplierMap = (suppliers: readonly Supplier[]): Map<SupplierCode, Supplier> =>
  new Map(suppliers.map((supplier) => [supplier.supplierCode, supplier]))
