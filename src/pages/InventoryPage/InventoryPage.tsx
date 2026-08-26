import { Checkbox } from '@/components/common/Checkbox'
import { Panel } from '@/components/common/Panel'
import { Select } from '@/components/common/Select'
import { SummaryCards } from '@/components/common/SummaryCards'
import { TextInput } from '@/components/common/TextInput'
import { PageHeader } from '@/components/layout/PageHeader'
import { InventoryTable } from '@/features/inventory/components/InventoryTable'
import { useInventoryPage } from './hooks'

export function InventoryPage() {
  const { rows, filter, setFilter, warehouseOptions, summaryItems } = useInventoryPage()

  return (
    <>
      <PageHeader
        title="재고"
        description="가용 재고 = 실물 - 예약. 소요량은 미결 수주를 번들 전개해 합산한 값입니다."
      />

      <SummaryCards items={summaryItems} />

      <Panel
        filter={
          <>
            <TextInput
              type="search"
              placeholder="품목코드 또는 품목명"
              value={filter.keyword}
              onChange={(event) => setFilter({ keyword: event.target.value })}
              aria-label="품목 검색"
            />
            <Select
              value={filter.warehouseId}
              onChange={(event) => setFilter({ warehouseId: event.target.value })}
              options={warehouseOptions}
              aria-label="창고"
            />
            <Checkbox
              label="위험 재고만"
              checked={filter.onlyRisk}
              onChange={(event) => setFilter({ onlyRisk: event.target.checked })}
            />
          </>
        }
      >
        <InventoryTable rows={rows} />
      </Panel>
    </>
  )
}
