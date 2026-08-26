import type { SelectOption } from '@/components/common/Select'
import type { SummaryCardItem } from '@/components/common/SummaryCards'
import type { InventoryFilter, InventoryRow } from '@/features/inventory/types'

export interface UseInventoryPageResult {
  rows: InventoryRow[]
  filter: InventoryFilter
  setFilter: (next: Partial<InventoryFilter>) => void
  warehouseOptions: SelectOption[]
  summaryItems: SummaryCardItem[]
}
