import type { SelectOption } from '@/components/common/Select'
import type { SummaryCardItem } from '@/components/common/SummaryCards'
import type { OrderDetail, OrderFilter, OrderRow } from '@/features/orders/types'
import type { ActionResult } from '@/store/erpStore'

export interface UseOrdersPageResult {
  rows: OrderRow[]
  filter: OrderFilter
  setFilter: (next: Partial<OrderFilter>) => void
  statusOptions: SelectOption[]
  warehouseOptions: SelectOption[]
  summaryItems: SummaryCardItem[]
  /** 선택된 수주의 상세. null 이면 드로어가 닫힌 상태 */
  detail: OrderDetail | null
  selectedOrderId: string | null
  select: (orderId: string) => void
  closeDetail: () => void
  /** 마지막 액션 결과 — 화면 상단 안내에 쓴다 */
  notice: ActionResult | null
  confirm: (orderId: string) => void
  ship: (orderId: string) => void
  cancel: (orderId: string) => void
  reset: () => void
}
