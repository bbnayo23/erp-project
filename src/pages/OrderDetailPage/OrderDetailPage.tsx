import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { Notice } from '@/components/common/Notice'
import { Panel } from '@/components/common/Panel'
import { StatusBadge } from '@/components/common/StatusBadge'
import { TextInput } from '@/components/common/TextInput'
import { PageHeader } from '@/components/layout/PageHeader'
import type {
  AssignedSerialRow,
  IncomingDocumentRow,
  PreparationItemRow,
} from '@/features/preparation/types'
import { useOrderDetailPage } from './hooks'
import {
  Actions,
  Blocks,
  Layout,
  Meta,
  Muted,
  Note,
  Overdue,
  ReceiveControl,
  SectionHint,
  SectionTitle,
  StatusCell,
  Summary,
} from './styled'

/**
 * 주문 상세 (가이드 §29).
 *
 * 네 숫자를 나란히 둔다 — 필요 · 가용재고 · 입고예정 · 부족. 담당자가 부족수량을 직접
 * 검산할 수 있어야 발주 버튼을 신뢰할 수 있다.
 *
 * 버튼은 상태에 따라 감춘다. 비활성 버튼을 남겨두면 왜 안 되는지를 버튼에서 찾게 되는데,
 * 이유는 품목 표와 확인 필요 사유에 있다.
 */
export function OrderDetailPage() {
  const navigate = useNavigate()
  const {
    found,
    orderId,
    summary,
    statusDescriptor,
    detail,
    blocks,
    excludedItemNames,
    itemRows,
    serialRows,
    incomingRows,
    actions,
    notice,
    dismissNotice,
    reserve,
    release,
    ship,
    issue,
    receiptQuantity,
    setReceiptQuantity,
    receive,
    inspect,
  } = useOrderDetailPage()

  const backToList = (
    <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
      목록으로
    </Button>
  )

  if (!found) {
    return (
      <Layout>
        <PageHeader title="주문을 찾을 수 없습니다" actions={backToList} />
        <Panel>
          <EmptyState
            title={`${orderId} 는 준비 대상 주문이 아닙니다`}
            description="취소·출고 완료·배송 완료 주문은 준비 현황에 오르지 않습니다."
            action={backToList}
          />
        </Panel>
      </Layout>
    )
  }

  const itemColumns: DataTableColumn<PreparationItemRow>[] = [
    {
      key: 'itemName',
      header: '상품',
      render: (row) => (
        <StatusCell>
          <span>{row.itemName}</span>
          <Note>
            {row.itemCode} · {row.itemType}
          </Note>
        </StatusCell>
      ),
    },
    { key: 'requiredQuantity', header: '필요', width: '80px', numeric: true },
    { key: 'availableQuantity', header: '가용재고', width: '90px', numeric: true },
    { key: 'incomingQuantity', header: '입고예정', width: '90px', numeric: true },
    {
      key: 'shortageQuantity',
      header: '부족',
      width: '80px',
      numeric: true,
      render: (row) => (row.shortageQuantity > 0 ? row.shortageQuantity : <Muted>0</Muted>),
    },
    {
      key: 'status',
      header: '상태',
      width: '220px',
      render: (row) => (
        <StatusCell>
          <StatusBadge descriptor={row.statusDescriptor} size="sm" />
          {row.note && <Note>{row.note}</Note>}
        </StatusCell>
      ),
    },
  ]

  const serialColumns: DataTableColumn<AssignedSerialRow>[] = [
    { key: 'serialNumber', header: '시리얼번호', width: '200px' },
    { key: 'itemName', header: '품목' },
    { key: 'location', header: '보관위치', width: '120px' },
    {
      key: 'status',
      header: '개체상태',
      width: '120px',
      render: (row) => (
        <Badge tone="primary" variant="subtle" size="sm">
          {row.status}
        </Badge>
      ),
    },
  ]

  const incomingColumns: DataTableColumn<IncomingDocumentRow>[] = [
    {
      key: 'documentId',
      header: '문서번호',
      width: '200px',
      render: (row) => (
        <StatusCell>
          <span>{row.documentId}</span>
          <Note>
            {row.typeLabel} · {row.supplierName}
          </Note>
        </StatusCell>
      ),
    },
    { key: 'itemName', header: '품목' },
    { key: 'plannedQuantity', header: '계획', width: '70px', numeric: true },
    { key: 'receivedQuantity', header: '입고', width: '70px', numeric: true },
    { key: 'remainingQuantity', header: '잔여', width: '70px', numeric: true },
    {
      key: 'availableLabel',
      header: '사용가능예정일',
      width: '150px',
      render: (row) => (
        <StatusCell>
          <span>{row.availableLabel}</span>
          {/* 배송일을 못 맞추는 물량은 대기 근거가 되지 못한다 — 있어도 부족은 부족이다 */}
          {!row.usable && <Note>배송일 이후 도착</Note>}
        </StatusCell>
      ),
    },
    {
      key: 'progressStatus',
      header: '진행상태',
      width: '140px',
      render: (row) => (
        <StatusCell>
          <span>{row.progressStatus}</span>
          {row.inspectionStatus !== '해당 없음' && <Note>검사 {row.inspectionStatus}</Note>}
        </StatusCell>
      ),
    },
    {
      key: 'receive',
      header: '처리',
      width: '210px',
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
        if (!row.canReceive) return <Muted>-</Muted>

        return (
          <ReceiveControl>
            <TextInput
              numeric
              aria-label={`${row.documentId} 입고 수량`}
              value={receiptQuantity(row.documentId)}
              onChange={(event) => setReceiptQuantity(row.documentId, event.target.value)}
            />
            <Button variant="primary" size="sm" onClick={() => receive(row.documentId)}>
              입고
            </Button>
          </ReceiveControl>
        )
      },
    },
  ]

  return (
    <Layout>
      <PageHeader
        title={summary.orderId}
        description={
          <Summary>
            <Meta>
              <div>
                <dt>주문상태</dt>
                <dd>{summary.orderStatus}</dd>
              </div>
              <div>
                <dt>준비상태</dt>
                <dd>
                  <StatusBadge descriptor={statusDescriptor} size="sm" />
                </dd>
              </div>
              <div>
                <dt>배송예정일</dt>
                <dd>
                  {summary.deliveryLabel}{' '}
                  {summary.overdue ? (
                    <Overdue>{summary.dueLabel}</Overdue>
                  ) : (
                    <Muted>{summary.dueLabel}</Muted>
                  )}
                </dd>
              </div>
              <div>
                <dt>출고창고</dt>
                <dd>{summary.warehouseName}</dd>
              </div>
              <div>
                <dt>주문접수</dt>
                <dd>{summary.orderedAtLabel}</dd>
              </div>
            </Meta>
            {/*
              배지만으로는 다음 행동을 알 수 없다 — 무엇을 기다리는지·무엇이 모자라는지.
              단 확인 필요 사유는 아래 패널이 그대로 띄우므로 여기서 반복하지 않는다.
            */}
            {blocks.length === 0 && <Note>{detail}</Note>}
          </Summary>
        }
        actions={
          <Actions>
            {actions.canReserve && (
              <Button variant="primary" onClick={reserve}>
                예약
              </Button>
            )}
            {actions.canShip && (
              <Button variant="primary" onClick={ship}>
                출고
              </Button>
            )}
            {actions.canRelease && (
              <Button variant="secondary" onClick={release}>
                예약 해제
              </Button>
            )}
            {actions.canIssue && (
              <Button variant="secondary" onClick={issue}>
                {actions.issueLabel}
              </Button>
            )}
            {backToList}
          </Actions>
        }
      />

      {notice && (
        <Notice tone={notice.tone}>
          {notice.message}
          <Button variant="link" size="sm" onClick={dismissNotice}>
            닫기
          </Button>
        </Notice>
      )}

      {blocks.length > 0 && (
        <Panel>
          <SectionTitle>확인 필요</SectionTitle>
          <SectionHint>
            자동으로 처리하지 않습니다. 재고를 바꾸지 않고, 발주도 만들지 않습니다.
          </SectionHint>
          <Blocks>
            {blocks.map((block) => (
              <li key={`${block.code}:${block.itemCode ?? ''}`}>
                <span aria-hidden>⚠️</span>
                <span>{block.message}</span>
              </li>
            ))}
          </Blocks>
        </Panel>
      )}

      <Panel>
        <SectionTitle>준비 품목</SectionTitle>
        <SectionHint>
          부족 = 필요 − 가용재고 − 입고예정. 가용재고는 배송일이 앞선 주문이 가져간 몫을 뺀
          나머지입니다.
          {excludedItemNames.length > 0 &&
            ` 재고 수요에서 제외된 항목: ${excludedItemNames.join(', ')}`}
        </SectionHint>
        <DataTable
          columns={itemColumns}
          data={itemRows}
          rowKey={(row) => row.itemCode}
          emptyTitle="준비할 품목이 없습니다"
          emptyDescription="취소 품목이거나 서비스 항목만 있습니다."
        />
      </Panel>

      {serialRows.length > 0 && (
        <Panel>
          <SectionTitle>배정된 개체</SectionTitle>
          <SectionHint>
            예약과 함께 먼저 입고된 개체부터 배정했습니다. 다른 주문은 이 개체를 고를 수 없습니다.
          </SectionHint>
          <DataTable columns={serialColumns} data={serialRows} rowKey={(row) => row.serialNumber} />
        </Panel>
      )}

      {incomingRows.length > 0 && (
        <Panel>
          <SectionTitle>입고예정</SectionTitle>
          <SectionHint>
            문서를 만든 것만으로 현재고는 늘지 않습니다. 입고해야 늘고, 생산품은 품질검사를 통과해야
            입고할 수 있습니다.
          </SectionHint>
          <DataTable
            columns={incomingColumns}
            data={incomingRows}
            rowKey={(row) => row.documentId}
          />
        </Panel>
      )}
    </Layout>
  )
}
