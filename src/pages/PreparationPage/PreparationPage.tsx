import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { COLUMN_WIDTH, DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { Panel } from '@/components/common/Panel'
import { Select } from '@/components/common/Select'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SummaryCards } from '@/components/common/SummaryCards'
import { TextInput } from '@/components/common/TextInput'
import { PageHeader } from '@/components/layout/PageHeader'
import { FreshnessBar } from '@/features/audit'
import type { PreparationRow } from '@/features/preparation/types'
import type { PreparationFilter, PreparationStatusFilter } from '@/features/preparation/types'
import { useFreshness } from '@/store/hooks'
import { usePreparationPage } from './hooks'
import { Checkbox } from '@/components/common/Checkbox'
import {
  DateCell,
  Detail,
  ExcludedMark,
  GroupCount,
  DueLabel,
  FilterRow,
  FilterSpacer,
  Layout,
  OrderId,
  Priority,
  ResultCount,
  StatusCell,
} from './styled'

/**
 * 배송 준비 현황 (가이드 §29).
 *
 * 목록 순서가 곧 재고를 배정받은 순서다. 배송일이 빠른 주문이 먼저 가져가고, 남은
 * 만큼만 뒤 주문에 간다 — 그래서 순위 컬럼을 첫 칸에 둔다. 같은 품목을 원하는 두
 * 주문의 상태가 다른 이유가 이 순서다.
 *
 * 이 컴포넌트에는 재고 계산이 없다. 판정은 도메인이, 표시용 가공은 hooks 가 끝냈다.
 */
export const PreparationPage = () => {
  const navigate = useNavigate()
  const {
    rows,
    groups,
    totalCount,
    filter,
    setFilter,
    resetFilter,
    filtered,
    statusOptions,
    reservedOptions,
    warehouseOptions,
    deliveryDateOptions,
    summaryItems,
    rowTone,
  } = usePreparationPage()

  const freshness = useFreshness()

  const columns: DataTableColumn<PreparationRow>[] = [
    {
      key: 'priority',
      header: '순위',
      width: COLUMN_WIDTH.sequence,
      align: 'center',
      render: (row) => <Priority>{row.priority}</Priority>,
    },
    {
      key: 'deliveryDate',
      header: '배송예정일',
      width: COLUMN_WIDTH.dateNote,
      render: (row) => (
        <DateCell>
          <span>{row.deliveryLabel}</span>
          <DueLabel $overdue={row.overdue}>{row.dueLabel}</DueLabel>
        </DateCell>
      ),
    },
    {
      key: 'orderId',
      header: '주문번호',
      width: COLUMN_WIDTH.orderId,
      render: (row) => <OrderId>{row.orderId}</OrderId>,
    },
    { key: 'warehouseName', header: '출고창고', width: COLUMN_WIDTH.warehouse },
    {
      key: 'itemCount',
      header: '준비 품목',
      width: COLUMN_WIDTH.quantity,
      numeric: true,
      render: (row) => `${row.itemCount}건`,
    },
    {
      key: 'shortageQuantity',
      header: '부족',
      width: COLUMN_WIDTH.quantity,
      numeric: true,
      render: (row) => (row.shortageQuantity > 0 ? `${row.shortageQuantity}개` : '-'),
    },
    {
      key: 'status',
      header: '준비상태',
      render: (row) =>
        row.excluded ? (
          // 취소·완료 주문은 판정 자체가 없다. 배지를 달면 처리할 것이 있어 보인다.
          <ExcludedMark>{row.orderStatus} · 준비 대상 아님</ExcludedMark>
        ) : (
          <StatusCell>
            <StatusBadge descriptor={row.statusDescriptor} />
            <Detail>{row.detail}</Detail>
          </StatusCell>
        ),
    },
  ]

  return (
    <Layout>
      <PageHeader
        title="주문"
        description={
          <>
            배송예정일이 빠른 주문부터 재고를 배정합니다. 앞선 주문이 가져간 몫은 뒤 주문의
            가용재고에서 빠집니다.
            <FreshnessBar freshness={freshness} />
          </>
        }
      />

      <SummaryCards items={summaryItems} label="준비 상태 요약" />

      <Panel
        filter={
          <FilterRow>
            <Select
              aria-label="준비상태"
              options={statusOptions}
              value={filter.status}
              onChange={(event) =>
                setFilter({ status: event.target.value as PreparationStatusFilter })
              }
            />
            <Select
              aria-label="예약 여부"
              options={reservedOptions}
              value={filter.reserved}
              onChange={(event) =>
                setFilter({ reserved: event.target.value as PreparationFilter['reserved'] })
              }
            />
            <Select
              aria-label="배송예정일"
              options={deliveryDateOptions}
              value={filter.deliveryDate}
              onChange={(event) => setFilter({ deliveryDate: event.target.value })}
            />
            <Select
              aria-label="출고창고"
              options={warehouseOptions}
              value={filter.warehouseCode}
              onChange={(event) => setFilter({ warehouseCode: event.target.value })}
            />
            <TextInput
              aria-label="주문번호 검색"
              placeholder="주문번호"
              value={filter.keyword}
              onChange={(event) => setFilter({ keyword: event.target.value })}
            />
            <Checkbox
              label="제외 주문 포함"
              checked={filter.includeExcluded}
              onChange={(event) => setFilter({ includeExcluded: event.target.checked })}
            />
            {filtered && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Icon name="reset" size={13} />}
                onClick={resetFilter}
              >
                필터 초기화
              </Button>
            )}
            <FilterSpacer />
            <ResultCount>
              {filtered ? `${rows.length}건 / 전체 ${totalCount}건` : `전체 ${totalCount}건`}
            </ResultCount>
          </FilterRow>
        }
      >
        <DataTable
          columns={columns}
          data={rows}
          groups={groups.map((group) => ({
            key: group.deliveryDate,
            span: (
              <>
                {group.label} <GroupCount>· {group.rows.length}건</GroupCount>
              </>
            ),
            size: group.rows.length,
          }))}
          rowKey={(row) => row.orderId}
          // 배지를 읽지 않고도 어느 행이 손댈 행인지 색으로 먼저 걸러낼 수 있어야 한다
          rowTone={rowTone}
          // 26줄이면 스크롤 중에 컬럼 이름을 잃는다
          stickyHeader
          // 목록은 판정만 보여준다. 예약·출고·발주는 품목별 숫자를 보고 눌러야 하므로 상세에 있다.
          onRowClick={(row) => navigate(`/orders/${row.orderId}`)}
          emptyTitle={filtered ? '조건에 맞는 주문이 없습니다' : '준비할 주문이 없습니다'}
          emptyDescription={
            filtered
              ? '필터를 바꾸거나 초기화해 보세요.'
              : '주문 확정 상태의 주문만 준비 대상입니다.'
          }
          emptyAction={
            filtered ? (
              <Button variant="secondary" size="sm" onClick={resetFilter}>
                필터 초기화
              </Button>
            ) : undefined
          }
        />
      </Panel>
    </Layout>
  )
}
