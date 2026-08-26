import type { OrderRow } from '@/features/orders/types'

export interface OrderTableProps {
  rows: OrderRow[]
  selectedOrderId: string | null
  onSelect: (orderId: string) => void
}
