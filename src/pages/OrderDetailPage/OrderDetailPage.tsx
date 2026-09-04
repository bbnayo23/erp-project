import { Link, useNavigate } from 'react-router-dom'
import { AlertModal } from '@/components/common/AlertModal'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { COLUMN_WIDTH, DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { Panel } from '@/components/common/Panel'
import { StatusBadge } from '@/components/common/StatusBadge'
import { TextInput } from '@/components/common/TextInput'
import { PageHeader } from '@/components/layout/PageHeader'
import { OrderSteps } from '@/features/preparation/OrderSteps'
import type {
  AssignedSerialRow,
  IncomingDocumentRow,
  OrderedItemRow,
  PreparationItemRow,
} from '@/features/preparation/types'
import { useOrderDetailPage } from './hooks'
import {
  Actions,
  Blocks,
  Layout,
  Main,
  Meta,
  Muted,
  Note,
  Overdue,
  RailBadge,
  RailCard,
  RailColumn,
  RailHead,
  RailLine,
  RailMeta,
  RailSticky,
  ReceiveControl,
  Split,
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
export const OrderDetailPage = () => {
  const navigate = useNavigate()
  const {
    found,
    orderId,
    summary,
    statusDescriptor,
    detail,
    blocks,
    excludedItemNames,
    railOrders,
    steps,
    currentStep,
    orderedRows,
    itemRows,
    serialRows,
    incomingRows,
    actions,
    dirty,
    alert,
    requestLeave,
    requestDiscard,
    confirmAlert,
    cancelAlert,
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
    <Button
      variant="ghost"
      size="sm"
      onClick={requestLeave}
      leftIcon={<Icon name="back" size={13} />}
    >
      목록으로
    </Button>
  )

  if (!found) {
    const backHome = (
      <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
        목록으로
      </Button>
    )

    return (
      <Layout>
        <PageHeader title="주문을 찾을 수 없습니다" actions={backHome} />
        <Panel>
          <EmptyState
            title={`${orderId} 는 준비 대상 주문이 아닙니다`}
            description="취소·출고 완료·배송 완료 주문은 준비 현황에 오르지 않습니다."
            action={backHome}
          />
        </Panel>
      </Layout>
    )
  }

  const orderedColumns: DataTableColumn<OrderedItemRow>[] = [
    { key: 'sequence', header: '순번', width: COLUMN_WIDTH.sequence, numeric: true },
    {
      key: 'itemName',
      header: '주문 품목',
      render: (row) => (
        <StatusCell>
          <span>{row.itemName}</span>
          <Note>
            {row.itemCode} · {row.itemType}
          </Note>
        </StatusCell>
      ),
    },
    { key: 'quantity', header: '주문수량', width: COLUMN_WIDTH.quantityWide, numeric: true },
    {
      key: 'status',
      header: '품목상태',
      width: COLUMN_WIDTH.status,
      render: (row) => (
        <Badge tone={row.status === '취소' ? 'neutral' : 'primary'} variant="subtle" size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'note',
      header: '준비 수요로 어떻게 옮겨졌나',
      render: (row) => (row.excluded ? <Muted>{row.note}</Muted> : row.note),
    },
  ]

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
    { key: 'requiredQuantity', header: '필요', width: COLUMN_WIDTH.quantity, numeric: true },
    { key: 'availableQuantity', header: '가용재고', width: COLUMN_WIDTH.quantity, numeric: true },
    { key: 'incomingQuantity', header: '입고예정', width: COLUMN_WIDTH.quantity, numeric: true },
    {
      key: 'shortageQuantity',
      header: '부족',
      width: COLUMN_WIDTH.quantity,
      numeric: true,
      render: (row) => (row.shortageQuantity > 0 ? row.shortageQuantity : <Muted>0</Muted>),
    },
    {
      key: 'status',
      header: '상태',
      width: COLUMN_WIDTH.statusNote,
      render: (row) => (
        <StatusCell>
          <StatusBadge descriptor={row.statusDescriptor} size="sm" />
          {row.note && <Note>{row.note}</Note>}
          {/*
            부족한 품목마다 발주로 가는 길을 둔다.
            머리말의 '부족분 발주' 는 전부를 한 번에 내고, 이 링크는 한 품목만 손본다.
          */}
          {row.shortageQuantity > 0 && (
            <Link
              to={`/inbound/new?itemCode=${row.itemCode}&warehouseCode=${summary.warehouseCode}&orderId=${summary.orderId}&quantity=${row.shortageQuantity}`}
            >
              이 품목만 발주
            </Link>
          )}
        </StatusCell>
      ),
    },
  ]

  const serialColumns: DataTableColumn<AssignedSerialRow>[] = [
    { key: 'serialNumber', header: '시리얼번호', width: COLUMN_WIDTH.serial },
    { key: 'itemName', header: '품목' },
    { key: 'location', header: '보관위치', width: COLUMN_WIDTH.location },
    {
      key: 'status',
      header: '개체상태',
      width: COLUMN_WIDTH.status,
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
      width: COLUMN_WIDTH.documentId,
      render: (row) => (
        <StatusCell>
          {/* 문서에서 발주 현황으로 건너갈 수 있어야 한다 — 세 화면이 서로를 가리킨다 */}
          <Link to="/inbound">{row.documentId}</Link>
          <Note>
            {row.typeLabel} · {row.supplierName}
          </Note>
        </StatusCell>
      ),
    },
    { key: 'itemName', header: '품목' },
    { key: 'plannedQuantity', header: '계획', width: COLUMN_WIDTH.quantity, numeric: true },
    { key: 'receivedQuantity', header: '입고', width: COLUMN_WIDTH.quantity, numeric: true },
    { key: 'remainingQuantity', header: '잔여', width: COLUMN_WIDTH.quantity, numeric: true },
    {
      key: 'availableLabel',
      header: '사용가능예정일',
      width: COLUMN_WIDTH.dateNote,
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
      width: COLUMN_WIDTH.statusNote,
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

  /**
   * 다음 할 일 줄에 세울 버튼.
   *
   * 머리말의 액션 묶음과 같은 핸들러를 부르지만 자리를 하나 더 둔다 — 머리말은 '이
   * 주문으로 할 수 있는 일 전부' 이고 이쪽은 '지금 하는 일 하나' 다. 담당자가 처음
   * 찾는 것은 뒤쪽이라, 고를 것 없이 하나만 보여야 한다.
   */
  const stepAction = (() => {
    if (!currentStep) return undefined

    switch (currentStep.key) {
      case 'ISSUE':
        return actions.canIssue ? (
          <Button
            variant="point"
            size="sm"
            leftIcon={<Icon name="plus" size={13} />}
            onClick={issue}
          >
            {actions.issueLabel}
          </Button>
        ) : undefined
      case 'RESERVE':
        return actions.canReserve ? (
          <Button
            variant="point"
            size="sm"
            leftIcon={<Icon name="lock" size={13} />}
            onClick={reserve}
          >
            예약
          </Button>
        ) : undefined
      case 'SHIP':
        return actions.canShip ? (
          <Button
            variant="point"
            size="sm"
            leftIcon={<Icon name="outbound" size={13} />}
            onClick={ship}
          >
            출고
          </Button>
        ) : undefined
      // 입고는 문서별 버튼이라 하나로 좁힐 수 없다 — 아래 입고예정 표로 보낸다
      case 'RECEIVE':
        return undefined
    }
  })()

  return (
    <Layout>
      <Split>
        <RailColumn aria-label="배송 준비 주문">
          <RailSticky>
            <RailHead>배정 순서 {railOrders.length}건</RailHead>
            {railOrders.map((row) => (
              <RailCard
                key={row.orderId}
                type="button"
                $current={row.orderId === summary.orderId}
                aria-current={row.orderId === summary.orderId ? 'true' : undefined}
                onClick={() => navigate(`/orders/${row.orderId}`)}
              >
                <RailLine>
                  <Muted>{row.priority}</Muted>
                  {row.orderId}
                </RailLine>
                <RailMeta>
                  {row.deliveryLabel} · {row.warehouseName}
                </RailMeta>
                <RailBadge>
                  <StatusBadge descriptor={row.statusDescriptor} size="sm" />
                </RailBadge>
              </RailCard>
            ))}
          </RailSticky>
        </RailColumn>

        <Main>
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
                {/*
                  머리말에는 되돌리는 액션만 둔다.
                  앞으로 가는 액션(예약 · 출고 · 발주)은 '다음 할 일' 줄이 하나만 낸다 —
                  같은 버튼을 두 자리에 두면 담당자가 둘을 다른 일로 읽고, 지금 눌러야
                  하는 것이 무엇인지가 다시 흐려진다.
                */}
                {dirty && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={requestDiscard}
                    leftIcon={<Icon name="back" size={13} />}
                  >
                    입력 취소
                  </Button>
                )}
                {actions.canRelease && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={release}
                    leftIcon={<Icon name="unlock" size={13} />}
                  >
                    예약 해제
                  </Button>
                )}
                {backToList}
              </Actions>
            }
          />

          <Panel
            tone="plain"
            title="처리 단계"
            description="재고로 바로 채워지는 주문은 발주 · 입고 칸을 건너뜁니다. 지금 칸이 끝나야 다음 칸이 열립니다."
            padded
          >
            <OrderSteps
              steps={steps}
              current={currentStep}
              action={stepAction}
              fallback={
                blocks.length > 0
                  ? '확인 필요 — 아래 사유를 해결해야 준비할 수 있습니다'
                  : '이 주문은 처리할 것이 남아 있지 않습니다'
              }
            />
          </Panel>

          {blocks.length > 0 && (
            <Panel
              tone="plain"
              title="확인 필요"
              description="자동으로 처리하지 않습니다. 재고를 바꾸지 않고, 발주도 만들지 않습니다."
              padded
            >
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

          <Panel
            tone="plain"
            title="주문 품목"
            description="06_주문에 적힌 그대로입니다. 세트는 아래 준비 품목에서 구성품으로 풀리고, 취소 품목과 서비스 항목은 준비 수량에서 빠집니다."
          >
            <DataTable
              columns={orderedColumns}
              data={orderedRows}
              rowKey={(row) => `${row.sequence}:${row.itemCode}`}
              emptyTitle="주문 품목이 없습니다"
            />
          </Panel>

          <Panel
            tone="plain"
            title="준비 품목"
            description={
              <>
                부족 = 필요 − 가용재고 − 입고예정. 가용재고는 배송일이 앞선 주문이 가져간 몫을 뺀
                나머지입니다.{' '}
                {excludedItemNames.length > 0 &&
                  ` 재고 수요에서 제외된 항목: ${excludedItemNames.join(', ')}`}
              </>
            }
          >
            <DataTable
              columns={itemColumns}
              data={itemRows}
              rowKey={(row) => row.itemCode}
              emptyTitle="준비할 품목이 없습니다"
              emptyDescription="취소 품목이거나 서비스 항목만 있습니다."
            />
          </Panel>

          {serialRows.length > 0 && (
            <Panel
              tone="plain"
              title="배정된 개체"
              description="예약과 함께 먼저 입고된 개체부터 배정했습니다. 다른 주문은 이 개체를 고를 수 없습니다."
            >
              <DataTable
                columns={serialColumns}
                data={serialRows}
                rowKey={(row) => row.serialNumber}
              />
            </Panel>
          )}

          {incomingRows.length > 0 && (
            <Panel
              tone="plain"
              title="입고예정"
              description="문서를 만든 것만으로 현재고는 늘지 않습니다. 입고해야 늘고, 생산품은 품질검사를 통과해야 입고할 수 있습니다."
            >
              <DataTable
                columns={incomingColumns}
                data={incomingRows}
                rowKey={(row) => row.documentId}
              />
            </Panel>
          )}
        </Main>
      </Split>

      <AlertModal
        open={alert !== null}
        title={alert?.title ?? ''}
        description={alert?.description}
        confirmLabel={alert?.confirmLabel}
        cancelLabel={alert?.cancelLabel}
        onConfirm={confirmAlert}
        onCancel={cancelAlert}
      />
    </Layout>
  )
}
