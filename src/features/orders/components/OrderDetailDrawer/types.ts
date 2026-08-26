import type { OrderDetail } from '@/features/orders/types'

export interface OrderDetailDrawerProps {
  /** null 이면 드로어가 닫힌 상태 */
  detail: OrderDetail | null
  onClose: () => void
  onConfirm: (orderId: string) => void
  onShip: (orderId: string) => void
  onCancel: (orderId: string) => void
}
