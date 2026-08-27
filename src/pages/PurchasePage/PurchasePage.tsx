import { Link } from 'react-router-dom'
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
import type {
  DocumentTypeFilter,
  IncomingRow,
  PurchaseStageFilter,
  ReceiptHistoryRow,
} from '@/features/purchase/types'
import { useFreshness } from '@/store/hooks'
import { usePurchasePage } from './hooks'
import {
  ArrivalLabel,
  DocumentId,
  FilterSpacer,
  Increase,
  Layout,
  Muted,
  Note,
  OrderLink,
  ReceiveControl,
  ResultCount,
  StackCell,
} from './styled'

/**
 * 발주 현황 (07_입고예정).
 *
 * 주문 상세에도 입고예정 표가 있지만 거기에는 그 주문이 기다리는 문서만 나온다.
 * 어느 주문에도 걸리지 않은 문서 — 재고를 채우려고 미리 낸 발주, 취소된 주문이
 * 남긴 문서 — 는 이 화면에서만 검사하고 입고할 수 있다.
 *
 * 목록은 처리할 것부터 위로 온다. 진행상태 7가지를 그대로 늘어놓으면 '생산 완료' 와
 * '검사 완료' 중 어느 쪽에 손을 대야 하는지 알 수 없어, 다음 행동으로 묶은 단계를
 * 따로 둔다. 07_입고예정의 진행상태·검사상태는 옆 칸에 그대로 남긴다 — 담당자가
 * 단계 판정을 검산할 수 있어야 한다.
 *
 * 이 컴포넌트에는 재고 계산이 없다. 판정은 도메인이, 표시용 가공은 hooks 와
 * features/purchase/utils 가 끝냈다 (가이드 §30).
 */
export function PurchasePage() {
  const {
    rows,
    totalCount,
    filter,
    setFilter,
    resetFilter,
    filtered,
    stageOptions,
    documentTypeOptions,
    warehouseOptions,
    summaryItems,
    receiptQuantity,
    setReceiptQuantity,
    receive,
    inspect,
    rowTone,
    history,
  } = usePurchasePage()

  const freshness = useFreshness()

  const columns: DataTableColumn<IncomingRow>[] = [
    {
      key: 'documentId',
      header: '문서번호',
      width: COLUMN_WIDTH.documentId,
      render: (row) => (
        <StackCell>
          <DocumentId>{row.documentId}</DocumentId>
          <Note>
            {row.typeLabel} · {row.supplierName}
          </Note>
          {/* 앱이 만든 문서는 어떤 주문의 부족분에서 나왔는지 되짚을 수 있어야 한다 */}
          {row.relatedOrderId && (
            <OrderLink>
              <Link to={`/orders/${row.relatedOrderId}`}>{row.relatedOrderId}</Link> 부족분
            </OrderLink>
          )}
        </StackCell>
      ),
    },
    {
      key: 'itemName',
      header: '품목',
      render: (row) => (
        <StackCell>
          <span>{row.itemName}</span>
          <Note>{row.itemCode}</Note>
        </StackCell>
      ),
    },
    { key: 'warehouseName', header: '입고창고', width: COLUMN_WIDTH.warehouse },
    { key: 'plannedQuantity', header: '계획', width: COLUMN_WIDTH.quantity, numeric: true },
    { key: 'receivedQuantity', header: '입고', width: COLUMN_WIDTH.quantity, numeric: true },
    {
      key: 'remainingQuantity',
      header: '잔여',
      width: COLUMN_WIDTH.quantity,
      numeric: true,
      render: (row) => (row.remainingQuantity > 0 ? row.remainingQuantity : <Muted>0</Muted>),
    },
    {
      key: 'availableLabel',
      header: '사용가능예정일',
      width: COLUMN_WIDTH.dateNote,
      render: (row) => (
        <StackCell>
          <span>{row.availableLabel}</span>
          <ArrivalLabel $overdue={row.overdue}>{row.arrivalLabel}</ArrivalLabel>
        </StackCell>
      ),
    },
    {
      key: 'progressStatus',
      header: '진행상태',
      width: COLUMN_WIDTH.statusNote,
      render: (row) => (
        <StackCell>
          <span>{row.progressStatus}</span>
          {row.inspectionStatus !== '해당 없음' && <Note>검사 {row.inspectionStatus}</Note>}
          {/* 확정여부는 준비 판단에 쓸 수 있는 물량인지를 가른다 — 진행상태와 같이 읽힌다 */}
          <Note>{row.confirmed ? '확정' : '미확정'}</Note>
        </StackCell>
      ),
    },
    {
      key: 'stage',
      header: '단계',
      width: COLUMN_WIDTH.statusNote,
      render: (row) => (
        <StackCell>
          <StatusBadge descriptor={row.stageDescriptor} size="sm" />
          <Note>{row.detail}</Note>
        </StackCell>
      ),
    },
    {
      key: 'action',
      header: '처리',
      width: COLUMN_WIDTH.action,
      align: 'right',
      render: (row) => {
        if (row.canInspect) {
          return (
            <ReceiveControl>
              <Button variant="secondary" size="sm" onClick={() => inspect(row.documentId)}>
                검사 통과
              </Button>
            </ReceiveControl>
          )
        }
        // 누를 수 없는 버튼을 회색으로 남기지 않는다. 왜 안 되는지는 단계 칸에 있다.
        if (!row.canReceive) return <Muted>-</Muted>

        return (
          <ReceiveControl>
            <TextInput
              numeric
              aria-label={`${row.documentId} 입고 수량`}
              value={receiptQuantity(row.documentId)}
              onChange={(event) => setReceiptQuantity(row.documentId, event.target.value)}
            />
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Icon name="inbound" size={13} />}
              onClick={() => receive(row.documentId)}
            >
              입고
            </Button>
          </ReceiveControl>
        )
      },
    },
  ]

  const historyColumns: DataTableColumn<ReceiptHistoryRow>[] = [
    {
      key: 'documentId',
      header: '문서번호',
      width: COLUMN_WIDTH.documentId,
      render: (row) => <DocumentId>{row.documentId ?? '-'}</DocumentId>,
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
      key: 'receivedQuantity',
      header: '입고수량',
      width: COLUMN_WIDTH.quantity,
      numeric: true,
      render: (row) => <Increase>+{row.receivedQuantity}</Increase>,
    },
    {
      key: 'currentQuantity',
      header: '입고 후 현재고',
      width: COLUMN_WIDTH.quantityWide,
      numeric: true,
    },
    {
      key: 'orderId',
      header: '풀린 주문',
      width: COLUMN_WIDTH.statusNote,
      render: (row) => {
        // 재고를 채우려고 미리 낸 발주는 걸린 주문이 없다 — 빈 칸이 정상이다
        if (!row.orderId) return <Muted>-</Muted>

        return (
          <StackCell>
            <Link to={`/orders/${row.orderId}`}>{row.orderId}</Link>
            {row.orderStatusDescriptor && (
              <StatusBadge descriptor={row.orderStatusDescriptor} size="sm" />
            )}
          </StackCell>
        )
      },
    },
    { key: 'occurredLabel', header: '처리시각', width: COLUMN_WIDTH.dateTime },
  ]

  return (
    <Layout>
      <PageHeader
        title="발주"
        description={
          <>
            문서를 만든 것만으로 현재고는 늘지 않습니다. 입고해야 늘고, 생산품은 품질검사를 통과해야
            입고할 수 있습니다.
            <FreshnessBar freshness={freshness} />
          </>
        }
      />

      <SummaryCards items={summaryItems} label="입고예정 단계 요약" />

      <Panel
        filter={
          <>
            <Select
              aria-label="단계"
              options={stageOptions}
              value={filter.stage}
              onChange={(event) => setFilter({ stage: event.target.value as PurchaseStageFilter })}
            />
            <Select
              aria-label="문서구분"
              options={documentTypeOptions}
              value={filter.documentType}
              onChange={(event) =>
                setFilter({ documentType: event.target.value as DocumentTypeFilter })
              }
            />
            <Select
              aria-label="입고창고"
              options={warehouseOptions}
              value={filter.warehouseCode}
              onChange={(event) => setFilter({ warehouseCode: event.target.value })}
            />
            <TextInput
              aria-label="문서번호·품목 검색"
              placeholder="문서번호 또는 품목"
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
          rowKey={(row) => row.documentId}
          rowTone={rowTone}
          stickyHeader
          emptyTitle={filtered ? '조건에 맞는 문서가 없습니다' : '입고예정 문서가 없습니다'}
          emptyDescription={
            filtered
              ? '필터를 바꾸거나 초기화해 보세요.'
              : '부족분 발주는 배송 준비 현황의 주문 상세에서 만듭니다 — 같은 품목을 기다리는 주문의 몫까지 한 번에 나가야 하기 때문입니다.'
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
            ) : (
              <Link to="/orders">
                <Button variant="secondary" size="sm">
                  배송 준비 현황으로
                </Button>
              </Link>
            )
          }
        />
      </Panel>

      <Panel
        title="입고 이력"
        description="입고한 수량만큼 현재고가 늘었는지, 그 물건을 기다리던 주문이 풀렸는지 확인합니다. 준비상태는 지금 다시 판정한 값입니다. 같은 입고 요청을 두 번 보내도 한 줄만 쌓입니다."
      >
        <DataTable
          columns={historyColumns}
          data={history}
          rowKey={(row) => row.movementId}
          stickyHeader
          maxHeight="320px"
          emptyTitle="아직 입고한 문서가 없습니다"
          emptyDescription="입고를 처리하면 현재고가 얼마나 늘었고 어느 주문이 풀렸는지 여기에 쌓입니다."
        />
      </Panel>
    </Layout>
  )
}
