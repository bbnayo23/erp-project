import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { Drawer } from '@/components/common/Drawer'
import { Panel } from '@/components/common/Panel'
import { Select } from '@/components/common/Select'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SummaryCards } from '@/components/common/SummaryCards'
import { TextInput } from '@/components/common/TextInput'
import { PageHeader } from '@/components/layout/PageHeader'
import type { SerialRow, StockLevelFilter, StockRow } from '@/features/inventory/types'
import { formatDateTime } from '@/utils/date'
import { useInventoryPage } from './hooks'
import {
  Available,
  DrawerHint,
  DrawerMeta,
  FilterSpacer,
  Layout,
  Muted,
  Note,
  ResultCount,
  SerialCell,
  StackCell,
  Warning,
} from './styled'

/**
 * 재고 현황 (04_재고현황 · 05_개체재고).
 *
 * 여기에는 재고를 바꾸는 버튼이 없다. 예약은 주문 단위로 전량 아니면 전무이고 입고는
 * 문서 단위이므로, 창고 재고를 직접 고치는 길을 두면 그 규칙을 우회할 수 있게 된다.
 *
 * 이 화면의 가용재고는 **창고 총량** 이다. 주문 상세의 가용재고와 다를 수 있다 — 저쪽은
 * 배송일이 앞선 주문이 가져간 몫을 뺀 나머지다. 같은 이름의 두 숫자가 어긋나 보이면
 * 담당자가 어느 쪽을 믿어야 할지 모르므로, 머리말에 기준을 밝힌다.
 */
export function InventoryPage() {
  const {
    rows,
    totalCount,
    filter,
    setFilter,
    resetFilter,
    filtered,
    levelOptions,
    warehouseOptions,
    summaryItems,
    drawer,
    openSerials,
    closeSerials,
    rowTone,
    baseAt,
  } = useInventoryPage()

  const columns: DataTableColumn<StockRow>[] = [
    {
      key: 'itemName',
      header: '품목',
      render: (row) => (
        <StackCell>
          <span>{row.itemName}</span>
          <Note>
            {row.itemCode} · {row.itemType}
          </Note>
        </StackCell>
      ),
    },
    {
      key: 'warehouseName',
      header: '창고',
      width: '160px',
      render: (row) => (
        <StackCell>
          <span>{row.warehouseName}</span>
          {/* 사용 중지 창고의 재고는 출고 준비 대상이 아니다 — 숫자만 보고 세면 안 된다 */}
          {row.inactiveWarehouse && (
            <Badge tone="neutral" variant="outline" size="sm">
              사용 중지
            </Badge>
          )}
        </StackCell>
      ),
    },
    { key: 'currentQuantity', header: '현재고', width: '80px', numeric: true },
    {
      key: 'reservedQuantity',
      header: '예약',
      width: '80px',
      numeric: true,
      render: (row) => (row.reservedQuantity > 0 ? row.reservedQuantity : <Muted>0</Muted>),
    },
    {
      key: 'availableQuantity',
      header: '가용재고',
      width: '90px',
      numeric: true,
      render: (row) => (
        <Available $empty={row.availableQuantity === 0}>{row.availableQuantity}</Available>
      ),
    },
    {
      key: 'incomingQuantity',
      header: '입고예정',
      width: '90px',
      numeric: true,
      render: (row) => (row.incomingQuantity > 0 ? row.incomingQuantity : <Muted>0</Muted>),
    },
    {
      key: 'level',
      header: '상태',
      width: '200px',
      render: (row) => (
        <StackCell>
          <StatusBadge descriptor={row.levelDescriptor} size="sm" />
          {row.existingReservationOrderId && (
            <Note>선행 예약 {row.existingReservationOrderId}</Note>
          )}
        </StackCell>
      ),
    },
    {
      key: 'serials',
      header: '개체',
      width: '190px',
      align: 'right',
      render: (row) => {
        // 시리얼 관리 품목이 아니면 개체가 없다. 빈 서랍을 여는 버튼을 두지 않는다.
        if (!row.serialManaged) return <Muted>-</Muted>

        return (
          <SerialCell>
            <Button variant="ghost" size="sm" onClick={() => openSerials(row)}>
              보관 {row.storedSerialCount} · 배정 {row.assignedSerialCount}
            </Button>
            {row.serialMismatch && <Warning>현재고와 개체 수가 다릅니다</Warning>}
          </SerialCell>
        )
      },
    },
  ]

  const serialColumns: DataTableColumn<SerialRow>[] = [
    { key: 'serialNumber', header: '시리얼번호', width: '180px' },
    { key: 'location', header: '보관위치', width: '110px' },
    {
      key: 'status',
      header: '개체상태',
      width: '130px',
      render: (row) => <StatusBadge descriptor={row.statusDescriptor} size="sm" />,
    },
    {
      key: 'reservedOrderId',
      header: '배정 주문',
      render: (row) => row.reservedOrderId ?? <Muted>-</Muted>,
    },
    { key: 'receivedLabel', header: '입고일', width: '120px' },
  ]

  return (
    <Layout>
      <PageHeader
        title="재고 현황"
        description={`가용재고 = 현재고 − 예약수량, 창고 총량 기준입니다. 주문 상세의 가용재고는 배송일이 앞선 주문이 가져간 몫을 뺀 나머지라 더 작을 수 있습니다. 기준시각 ${formatDateTime(baseAt)}`}
      />

      <SummaryCards items={summaryItems} label="재고 요약" />

      <Panel
        filter={
          <>
            <Select
              aria-label="재고 상태"
              options={levelOptions}
              value={filter.level}
              onChange={(event) => setFilter({ level: event.target.value as StockLevelFilter })}
            />
            <Select
              aria-label="창고"
              options={warehouseOptions}
              value={filter.warehouseCode}
              onChange={(event) => setFilter({ warehouseCode: event.target.value })}
            />
            <TextInput
              aria-label="품목 검색"
              placeholder="품목코드 또는 품목명"
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
          </>
        }
      >
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(row) => row.key}
          rowTone={rowTone}
          stickyHeader
          emptyTitle={filtered ? '조건에 맞는 재고가 없습니다' : '재고가 없습니다'}
          emptyDescription={
            filtered
              ? '필터를 바꾸거나 초기화해 보세요.'
              : '04_재고현황에 행이 없고 확정된 입고예정도 없습니다.'
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

      <Drawer
        open={drawer !== null}
        onClose={closeSerials}
        title={drawer ? `${drawer.row.itemName} 개체재고` : ''}
        description={drawer ? `${drawer.row.itemCode} · ${drawer.row.warehouseName}` : undefined}
      >
        {drawer && (
          <>
            <DrawerMeta>
              <div>
                <dt>창고 보관 중</dt>
                <dd>{drawer.row.storedSerialCount}</dd>
              </div>
              <div>
                <dt>주문 배정됨</dt>
                <dd>{drawer.row.assignedSerialCount}</dd>
              </div>
              <div>
                <dt>현재고</dt>
                <dd>{drawer.row.currentQuantity}</dd>
              </div>
            </DrawerMeta>

            {drawer.row.serialMismatch ? (
              <DrawerHint>
                <Warning>
                  창고에 남아 있는 개체 수가 현재고와 다릅니다. 이 상태에서는 수량이 맞아도 예약이
                  개체 부족으로 막힙니다.
                </Warning>
              </DrawerHint>
            ) : (
              <DrawerHint>
                창고에 남아 있는 개체 수(보관 + 배정)가 곧 현재고입니다. 출고 완료 개체는 창고를
                떠났으므로 세지 않습니다. 예약은 먼저 입고된 개체부터 가져갑니다.
              </DrawerHint>
            )}

            <DataTable
              columns={serialColumns}
              data={drawer.serials}
              rowKey={(row) => row.serialNumber}
              emptyTitle="등록된 개체가 없습니다"
            />
          </>
        )}
      </Drawer>
    </Layout>
  )
}
