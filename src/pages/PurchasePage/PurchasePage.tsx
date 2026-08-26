import { Button } from '@/components/common/Button'
import { Notice } from '@/components/common/Notice'
import { Panel } from '@/components/common/Panel'
import { Select } from '@/components/common/Select'
import { SummaryCards } from '@/components/common/SummaryCards'
import { PageHeader } from '@/components/layout/PageHeader'
import { PurchaseOrderTable } from '@/features/purchase/components/PurchaseOrderTable'
import { ReceiveModal } from '@/features/purchase/components/ReceiveModal'
import { ShortageTable } from '@/features/purchase/components/ShortageTable'
import { usePurchasePage } from './hooks'
import { SectionHeader, SectionNote, SectionTitle } from './styled'

export function PurchasePage() {
  const {
    warehouseId,
    setWarehouseId,
    warehouseOptions,
    shortageRows,
    purchaseRows,
    summaryItems,
    notice,
    canCreatePurchaseOrders,
    createPurchaseOrders,
    receivingOrder,
    openReceive,
    closeReceive,
    receive,
  } = usePurchasePage()

  return (
    <>
      <PageHeader
        title="발주"
        description="부족분 = 소요량 + 안전재고 - 가용재고 - 입고예정. 공급처별로 묶어 발주합니다."
        actions={
          <Button disabled={!canCreatePurchaseOrders} onClick={createPurchaseOrders}>
            부족분 발주 생성
          </Button>
        }
      />

      {notice && <Notice tone={notice.ok ? 'success' : 'danger'}>{notice.message}</Notice>}

      <SummaryCards items={summaryItems} />

      <Panel
        filter={
          <Select
            value={warehouseId}
            onChange={(event) => setWarehouseId(event.target.value)}
            options={warehouseOptions}
            aria-label="창고"
          />
        }
      >
        <ShortageTable rows={shortageRows} />
      </Panel>

      <SectionHeader>
        <SectionTitle>발주 현황</SectionTitle>
        <SectionNote>입고 처리하면 해당 창고 실물 재고가 늘어납니다.</SectionNote>
      </SectionHeader>

      <Panel>
        <PurchaseOrderTable rows={purchaseRows} onReceive={openReceive} />
      </Panel>

      <ReceiveModal purchaseOrder={receivingOrder} onClose={closeReceive} onSubmit={receive} />
    </>
  )
}
