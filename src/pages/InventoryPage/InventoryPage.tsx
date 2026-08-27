import { Link } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { COLUMN_WIDTH, DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { Drawer } from '@/components/common/Drawer'
import { Panel } from '@/components/common/Panel'
import { Select } from '@/components/common/Select'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SummaryCards } from '@/components/common/SummaryCards'
import { TextInput } from '@/components/common/TextInput'
import { PageHeader } from '@/components/layout/PageHeader'
import { FreshnessBar } from '@/features/audit'
import type {
  ItemDemandRow,
  ItemDocumentRow,
  SerialRow,
  StockLevelFilter,
  StockMovementRow,
  StockRow,
} from '@/features/inventory/types'
import { useFreshness, useRecentChanges } from '@/store/hooks'
import { useInventoryPage } from './hooks'
import {
  Available,
  Delta,
  JustChanged,
  DrawerHint,
  Formula,
  Identity,
  DrawerStack,
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
/** 증감 라벨의 방향. '-' 는 움직이지 않은 칸이다. */
const signOf = (label: string): 'up' | 'down' | 'none' => {
  if (label.startsWith('+')) return 'up'
  if (label.startsWith('−')) return 'down'
  return 'none'
}

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
    openDetail,
    closeDetail,
    movements,
    rowTone,
  } = useInventoryPage()

  const freshness = useFreshness()
  /** 방금 처리가 건드린 자리 — 내 조작이 의도한 행에 반영됐는지 눈으로 본다 */
  const recentChanges = useRecentChanges()

  const columns: DataTableColumn<StockRow>[] = [
    {
      key: 'itemName',
      header: '품목',
      render: (row) => (
        <StackCell>
          <span>{row.itemName}</span>
          <Note>
            {row.itemCode} · {row.category} · {row.itemType}
          </Note>
          {/*
            방금 처리한 자리를 짚어준다.
            숫자만 바뀌면 26줄 중 어디가 바뀐 것인지 다시 찾아야 한다.
          */}
          {recentChanges.has(row.key) && (
            <JustChanged data-testid={`recent-${row.key}`}>
              방금 {recentChanges.get(row.key)}
            </JustChanged>
          )}
          {/* 시리얼 관리 품목은 수량이 맞아도 개체가 모자라면 예약이 막힌다 */}
          <Badge tone={row.serialManaged ? 'info' : 'neutral'} variant="outline" size="sm">
            {row.serialManaged ? '시리얼 관리' : '수량 관리'}
          </Badge>
        </StackCell>
      ),
    },
    {
      key: 'warehouseName',
      header: '창고',
      width: COLUMN_WIDTH.warehouse,
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
    { key: 'currentQuantity', header: '현재고', width: COLUMN_WIDTH.quantity, numeric: true },
    {
      key: 'reservedQuantity',
      header: '예약',
      width: COLUMN_WIDTH.quantity,
      numeric: true,
      render: (row) => (row.reservedQuantity > 0 ? row.reservedQuantity : <Muted>0</Muted>),
    },
    {
      key: 'availableQuantity',
      header: '가용재고',
      width: COLUMN_WIDTH.quantity,
      numeric: true,
      render: (row) => (
        <Available $empty={row.availableQuantity === 0}>{row.availableQuantity}</Available>
      ),
    },
    {
      key: 'incomingQuantity',
      header: '입고예정',
      width: COLUMN_WIDTH.quantity,
      numeric: true,
      render: (row) => (row.incomingQuantity > 0 ? row.incomingQuantity : <Muted>0</Muted>),
    },
    {
      key: 'level',
      header: '상태',
      width: COLUMN_WIDTH.statusNote,
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
      width: COLUMN_WIDTH.action,
      align: 'right',
      render: (row) => {
        // 시리얼 관리 품목이 아니면 개체가 없다. 빈 서랍을 여는 버튼을 두지 않는다.
        if (!row.serialManaged) return <Muted>-</Muted>

        return (
          <SerialCell>
            <Button variant="ghost" size="sm" onClick={() => openDetail(row)}>
              보관 {row.storedSerialCount} · 배정 {row.assignedSerialCount}
            </Button>
            {row.serialMismatch && <Warning>현재고와 개체 수가 다릅니다</Warning>}
          </SerialCell>
        )
      },
    },
  ]

  const serialColumns: DataTableColumn<SerialRow>[] = [
    { key: 'serialNumber', header: '시리얼번호', width: COLUMN_WIDTH.serial },
    { key: 'location', header: '보관위치', width: COLUMN_WIDTH.location },
    {
      key: 'status',
      header: '개체상태',
      width: COLUMN_WIDTH.status,
      render: (row) => <StatusBadge descriptor={row.statusDescriptor} size="sm" />,
    },
    {
      key: 'reservedOrderId',
      header: '배정 주문',
      render: (row) => row.reservedOrderId ?? <Muted>-</Muted>,
    },
    { key: 'receivedLabel', header: '입고일', width: COLUMN_WIDTH.date },
  ]

  const demandColumns: DataTableColumn<ItemDemandRow>[] = [
    {
      key: 'orderId',
      header: '주문',
      render: (row) => (
        <StackCell>
          {/* 재고에서 주문으로 건너갈 수 있어야 한다 — 세 화면이 같은 데이터를 보는 길이다 */}
          <Link to={`/orders/${row.orderId}`}>{row.orderId}</Link>
          <Note>배정 순서 {row.priority}</Note>
        </StackCell>
      ),
    },
    { key: 'deliveryLabel', header: '배송예정일', width: COLUMN_WIDTH.dateNote },
    { key: 'requiredQuantity', header: '필요', width: COLUMN_WIDTH.quantity, numeric: true },
    {
      key: 'shortageQuantity',
      header: '부족',
      width: COLUMN_WIDTH.quantity,
      numeric: true,
      render: (row) => (row.shortageQuantity > 0 ? row.shortageQuantity : <Muted>0</Muted>),
    },
    {
      key: 'status',
      header: '준비상태',
      width: COLUMN_WIDTH.statusNote,
      render: (row) => <StatusBadge descriptor={row.statusDescriptor} size="sm" />,
    },
  ]

  const documentColumns: DataTableColumn<ItemDocumentRow>[] = [
    {
      key: 'documentId',
      header: '문서번호',
      render: (row) => (
        <StackCell>
          <Link to="/inbound">{row.documentId}</Link>
          <Note>
            {row.typeLabel} · {row.supplierName}
            {row.relatedOrderId ? ` · ${row.relatedOrderId} 부족분` : ''}
          </Note>
        </StackCell>
      ),
    },
    { key: 'plannedQuantity', header: '계획', width: COLUMN_WIDTH.quantity, numeric: true },
    { key: 'receivedQuantity', header: '입고', width: COLUMN_WIDTH.quantity, numeric: true },
    { key: 'remainingQuantity', header: '잔여', width: COLUMN_WIDTH.quantity, numeric: true },
    { key: 'availableLabel', header: '사용가능예정일', width: COLUMN_WIDTH.dateNote },
    {
      key: 'stage',
      header: '단계',
      width: COLUMN_WIDTH.statusNote,
      render: (row) => <StatusBadge descriptor={row.stageDescriptor} size="sm" />,
    },
  ]

  const movementColumns: DataTableColumn<StockMovementRow>[] = [
    {
      key: 'kind',
      header: '처리',
      width: COLUMN_WIDTH.status,
      render: (row) => <StatusBadge descriptor={row.kindDescriptor} size="sm" />,
    },
    {
      key: 'itemName',
      header: '품목',
      render: (row) => (
        <StackCell>
          <span>{row.itemName}</span>
          <Note>
            {row.itemCode} · {row.warehouseName}
          </Note>
        </StackCell>
      ),
    },
    {
      key: 'currentDeltaLabel',
      header: '현재고 증감',
      width: COLUMN_WIDTH.quantityWide,
      numeric: true,
      render: (row) => <Delta $sign={signOf(row.currentDeltaLabel)}>{row.currentDeltaLabel}</Delta>,
    },
    { key: 'currentQuantity', header: '현재고', width: COLUMN_WIDTH.quantity, numeric: true },
    {
      key: 'reservedDeltaLabel',
      header: '예약 증감',
      width: COLUMN_WIDTH.quantityWide,
      numeric: true,
      render: (row) => (
        <Delta $sign={signOf(row.reservedDeltaLabel)}>{row.reservedDeltaLabel}</Delta>
      ),
    },
    { key: 'reservedQuantity', header: '예약수량', width: COLUMN_WIDTH.quantity, numeric: true },
    {
      key: 'reference',
      header: '근거',
      width: COLUMN_WIDTH.statusNote,
      render: (row) => (
        <StackCell>
          {row.orderId && <Link to={`/orders/${row.orderId}`}>{row.orderId}</Link>}
          {row.documentId && (
            <Note>
              <Link to="/inbound">{row.documentId}</Link>
            </Note>
          )}
          {!row.orderId && !row.documentId && <Muted>-</Muted>}
        </StackCell>
      ),
    },
  ]

  return (
    <Layout>
      <PageHeader
        title="제품"
        description={
          <>
            가용재고 = 현재고 − 예약수량, 창고 총량 기준입니다. 주문 상세의 가용재고는 배송일이 앞선
            주문이 가져간 몫을 뺀 나머지라 더 작을 수 있습니다.
            <FreshnessBar freshness={freshness} />
          </>
        }
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
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilter}
                leftIcon={<Icon name="reset" size={13} />}
              >
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
          onRowClick={openDetail}
          stickyHeader
          emptyTitle={filtered ? '조건에 맞는 재고가 없습니다' : '재고가 없습니다'}
          emptyDescription={
            filtered
              ? '필터를 바꾸거나 초기화해 보세요.'
              : '04_재고현황에 행이 없고 확정된 입고예정도 없습니다.'
          }
          emptyAction={
            filtered ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={resetFilter}
                leftIcon={<Icon name="reset" size={13} />}
              >
                필터 초기화
              </Button>
            ) : undefined
          }
        />
      </Panel>

      <Panel
        title="재고 이력"
        description="예약 · 출고 · 입고가 어느 칸을 얼마나 움직였는지, 움직인 뒤 잔액이 얼마인지 남습니다. 같은 요청을 두 번 보내도 한 줄만 쌓입니다."
      >
        <DataTable
          columns={movementColumns}
          data={movements}
          rowKey={(row) => row.movementId}
          stickyHeader
          maxHeight="360px"
          emptyTitle="아직 재고가 움직인 적이 없습니다"
          emptyDescription="배송 준비 현황에서 예약 · 출고를, 발주 현황에서 입고를 처리하면 여기에 쌓입니다."
        />
      </Panel>

      <Drawer
        open={drawer !== null}
        onClose={closeDetail}
        title={drawer ? drawer.row.itemName : ''}
        description={
          drawer
            ? `${drawer.row.itemCode} · ${drawer.row.category} · ${drawer.row.warehouseName}`
            : undefined
        }
      >
        {drawer && (
          <DrawerStack>
            {/*
              두 항등식을 화면에서 바로 검산할 수 있어야 한다.
              재고 화면의 본질은 '믿을 수 있나' 이고, 그 답은 숫자를 나열하는 것이 아니라
              숫자끼리 맞아떨어지는 것을 보여주는 것이다.
            */}
            <Identity data-testid="identity-available">
              <dt>가용재고</dt>
              <dd>
                <b>{drawer.row.availableQuantity}</b>
                <Formula>
                  = 현재고 {drawer.row.currentQuantity} − 예약 {drawer.row.reservedQuantity}
                </Formula>
              </dd>
            </Identity>

            {drawer.row.serialManaged && (
              <Identity
                data-testid="identity-serial"
                $broken={drawer.row.serialMismatch}
                aria-invalid={drawer.row.serialMismatch || undefined}
              >
                <dt>현재고</dt>
                <dd>
                  <b>{drawer.row.currentQuantity}</b>
                  <Formula>
                    {drawer.row.serialMismatch ? '≠ ' : '= '}
                    보관 {drawer.row.storedSerialCount} + 배정 {drawer.row.assignedSerialCount}
                  </Formula>
                </dd>
              </Identity>
            )}

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

            <Panel tone="plain" title="개체 목록">
              <DataTable
                columns={serialColumns}
                data={drawer.serials}
                rowKey={(row) => row.serialNumber}
                emptyTitle="등록된 개체가 없습니다"
              />
            </Panel>

            <Panel
              tone="plain"
              title="이 품목을 기다리는 주문"
              description="배정 순서가 빠른 주문이 재고를 먼저 가져갑니다. 주문번호를 누르면 주문 상세로 갑니다."
            >
              <DataTable
                columns={demandColumns}
                data={drawer.demands}
                rowKey={(row) => row.orderId}
                emptyTitle="이 품목을 기다리는 주문이 없습니다"
                emptyDescription="이 창고에서 나가는 준비 대상 주문 중 이 품목을 쓰는 주문이 없습니다."
              />
            </Panel>

            <Panel
              tone="plain"
              title="걸려 있는 발주 · 생산의뢰"
              description="문서를 만든 것만으로 현재고는 늘지 않습니다. 입고해야 늘어납니다."
            >
              <DataTable
                columns={documentColumns}
                data={drawer.documents}
                rowKey={(row) => row.documentId}
                emptyTitle="걸려 있는 문서가 없습니다"
              />
            </Panel>

            <Panel
              tone="plain"
              title="재고 이력"
              description="예약은 예약수량만, 출고는 현재고와 예약수량을 함께, 입고는 현재고만 움직입니다."
            >
              <DataTable
                columns={movementColumns}
                data={drawer.movements}
                rowKey={(row) => row.movementId}
                emptyTitle="아직 이 품목의 재고가 움직인 적이 없습니다"
                emptyDescription="예약 · 출고 · 입고를 처리하면 여기에 쌓입니다."
              />
            </Panel>
          </DrawerStack>
        )}
      </Drawer>
    </Layout>
  )
}
