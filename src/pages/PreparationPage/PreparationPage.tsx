import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { Panel } from '@/components/common/Panel'
import { Select } from '@/components/common/Select'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SummaryCards } from '@/components/common/SummaryCards'
import { TextInput } from '@/components/common/TextInput'
import { Tour } from '@/components/common/Tour'
import { PageHeader } from '@/components/layout/PageHeader'
import type { PreparationRow } from '@/features/preparation/types'
import type { PreparationFilter, PreparationStatusFilter } from '@/features/preparation/types'
import { WorkflowGuide } from '@/features/workflow'
import { usePreparationPage } from './hooks'
import {
  DateCell,
  Detail,
  DueLabel,
  FilterRow,
  FilterSpacer,
  Layout,
  OrderId,
  Priority,
  ResultCount,
  StatusCell,
  TourTarget,
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
export function PreparationPage() {
  const navigate = useNavigate()
  const {
    rows,
    totalCount,
    filter,
    setFilter,
    resetFilter,
    filtered,
    statusOptions,
    reservedOptions,
    warehouseOptions,
    summaryItems,
    rowTone,
    guide,
    selectStep,
    tourSteps,
    tourOpen,
    openTour,
    closeTour,
    baseAt,
  } = usePreparationPage()

  const columns: DataTableColumn<PreparationRow>[] = [
    {
      key: 'priority',
      header: '순위',
      width: '64px',
      align: 'center',
      render: (row) => <Priority>{row.priority}</Priority>,
    },
    {
      key: 'deliveryDate',
      header: '배송예정일',
      width: '140px',
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
      width: '180px',
      render: (row) => <OrderId>{row.orderId}</OrderId>,
    },
    { key: 'warehouseName', header: '출고창고', width: '140px' },
    {
      key: 'itemCount',
      header: '준비 품목',
      width: '90px',
      numeric: true,
      render: (row) => `${row.itemCount}건`,
    },
    {
      key: 'shortageQuantity',
      header: '부족',
      width: '90px',
      numeric: true,
      render: (row) => (row.shortageQuantity > 0 ? `${row.shortageQuantity}개` : '-'),
    },
    {
      key: 'status',
      header: '준비상태',
      render: (row) => (
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
        title="배송 준비 현황"
        description="배송예정일이 빠른 주문부터 재고를 배정합니다. 앞선 주문이 가져간 몫은 뒤 주문의 가용재고에서 빠집니다."
        actions={
          <Button variant="secondary" size="sm" onClick={openTour}>
            화면 안내
          </Button>
        }
      />

      {/*
        안내 대상은 `data-tour` 로 표시한다. ref 로 꿰면 안내와 무관한 컴포넌트의
        props 를 오염시키므로, 페이지에서 감싸는 쪽을 골랐다.
      */}
      <TourTarget data-tour="workflow">
        {/* 화면을 열면 가장 먼저 보이는 것이 '무엇부터 할지' 여야 한다 */}
        <WorkflowGuide guide={guide} baseAt={baseAt} onSelect={selectStep} />
      </TourTarget>

      <TourTarget data-tour="summary">
        <SummaryCards items={summaryItems} label="준비 상태 요약" />
      </TourTarget>

      <Panel
        filter={
          <FilterRow data-tour="filters">
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
            {filtered && (
              <Button variant="ghost" size="sm" onClick={resetFilter}>
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
        <TourTarget data-tour="table">
          <DataTable
            columns={columns}
            data={rows}
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
        </TourTarget>
      </Panel>

      {/* 열려 있을 때만 마운트한다 — Tour 의 상태가 매번 처음부터 시작해야 한다 */}
      {tourOpen && <Tour steps={tourSteps} onClose={closeTour} label="배송 준비 현황 안내" />}
    </Layout>
  )
}
