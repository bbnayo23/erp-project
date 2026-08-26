import type { PurchaseOrderRow } from '@/features/purchase/types'

export interface PurchaseOrderTableProps {
  rows: PurchaseOrderRow[]
  onReceive: (purchaseOrderId: string) => void
}
