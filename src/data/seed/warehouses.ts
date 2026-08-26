import type { Warehouse } from '@/features/inventory/types'

export const SEED_WAREHOUSES: Warehouse[] = [
  { id: 'WH-1', code: 'SEL', name: '서울 본사창고', isDefault: true },
  { id: 'WH-2', code: 'BSN', name: '부산 물류센터', isDefault: false },
]
