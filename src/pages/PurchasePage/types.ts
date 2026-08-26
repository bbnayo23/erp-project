import type { SelectOption } from '@/components/common/Select'
import type { SummaryCardItem } from '@/components/common/SummaryCards'
import type {
  PurchaseOrder,
  PurchaseOrderRow,
  ReceiptLine,
  ShortageRow,
} from '@/features/purchase/types'
import type { ActionResult } from '@/store/erpStore'

export interface UsePurchasePageResult {
  warehouseId: string
  setWarehouseId: (warehouseId: string) => void
  warehouseOptions: SelectOption[]
  shortageRows: ShortageRow[]
  purchaseRows: PurchaseOrderRow[]
  summaryItems: SummaryCardItem[]
  notice: ActionResult | null
  /** 부족분이 없으면 발주 생성 버튼을 잠근다 */
  canCreatePurchaseOrders: boolean
  createPurchaseOrders: () => void
  /** 입고 모달 대상. null 이면 닫힌 상태 */
  receivingOrder: PurchaseOrder | null
  openReceive: (purchaseOrderId: string) => void
  closeReceive: () => void
  receive: (receipts: ReceiptLine[]) => void
}
