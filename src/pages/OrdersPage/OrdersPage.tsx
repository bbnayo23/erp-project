import { Button } from '@/components/common/Button'
import { Notice } from '@/components/common/Notice'
import { Panel } from '@/components/common/Panel'
import { Select } from '@/components/common/Select'
import { SummaryCards } from '@/components/common/SummaryCards'
import { TextInput } from '@/components/common/TextInput'
import { PageHeader } from '@/components/layout/PageHeader'
import { OrderDetailDrawer } from '@/features/orders/components/OrderDetailDrawer'
import { OrderTable } from '@/features/orders/components/OrderTable'
import type { OrderFilter } from '@/features/orders/types'
import { useOrdersPage } from './hooks'

export function OrdersPage() {
  const {
    rows,
    filter,
    setFilter,
    statusOptions,
    warehouseOptions,
    summaryItems,
    detail,
    selectedOrderId,
    select,
    closeDetail,
    notice,
    confirm,
    ship,
    cancel,
    reset,
  } = useOrdersPage()

  return (
    <>
      <PageHeader
        title="수주"
        description="확정하면 가용 재고 범위에서 예약합니다. 전량 예약된 수주만 출하할 수 있습니다."
        actions={
          <Button variant="secondary" onClick={reset}>
            데이터 초기화
          </Button>
        }
      />

      {notice && <Notice tone={notice.ok ? 'success' : 'danger'}>{notice.message}</Notice>}

      <SummaryCards items={summaryItems} />

      <Panel
        filter={
          <>
            <TextInput
              type="search"
              placeholder="수주번호 또는 고객명"
              value={filter.keyword}
              onChange={(event) => setFilter({ keyword: event.target.value })}
              aria-label="수주 검색"
            />
            <Select
              value={filter.status}
              onChange={(event) =>
                setFilter({ status: event.target.value as OrderFilter['status'] })
              }
              options={statusOptions}
              aria-label="상태"
            />
            <Select
              value={filter.warehouseId}
              onChange={(event) => setFilter({ warehouseId: event.target.value })}
              options={warehouseOptions}
              aria-label="출고창고"
            />
          </>
        }
      >
        <OrderTable rows={rows} selectedOrderId={selectedOrderId} onSelect={select} />
      </Panel>

      <OrderDetailDrawer
        detail={detail}
        onClose={closeDetail}
        onConfirm={confirm}
        onShip={ship}
        onCancel={cancel}
      />
    </>
  )
}
