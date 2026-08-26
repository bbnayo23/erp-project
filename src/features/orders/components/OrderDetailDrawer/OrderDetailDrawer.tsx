import { Button } from '@/components/common/Button'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { Drawer } from '@/components/common/Drawer'
import { StatusBadge } from '@/components/common/StatusBadge'
import { canCancel, canConfirm, canShip } from '@/domain/order/evaluateOrderStatus'
import type { OrderComponentRow, OrderLineRow } from '@/features/orders/types'
import { ORDER_STATUS } from '@/features/orders/utils'
import { formatDate, formatDueLabel } from '@/utils/date'
import { formatCurrency, formatNumber, formatQuantity } from '@/utils/number'
import {
  Bordered,
  Label,
  Meta,
  Muted,
  Section,
  SectionNote,
  SectionTitle,
  Shortfall,
  Value,
} from './styled'
import type { OrderDetailDrawerProps } from './types'

const dash = <Muted>-</Muted>

const lineColumns: DataTableColumn<OrderLineRow>[] = [
  {
    key: 'item',
    header: '품목',
    render: (line) => (
      <div>
        <div>{line.itemName}</div>
        <Muted>
          {line.itemCode}
          {line.itemType === 'BUNDLE' ? ' · 번들' : ''}
        </Muted>
      </div>
    ),
  },
  {
    key: 'quantity',
    header: '수량',
    numeric: true,
    render: (line) => formatQuantity(line.quantity, line.unit),
  },
  { key: 'amount', header: '금액', numeric: true, render: (line) => formatCurrency(line.amount) },
]

const componentColumns: DataTableColumn<OrderComponentRow>[] = [
  {
    key: 'item',
    header: '구성품',
    render: (row) => (
      <div>
        <div>{row.itemName}</div>
        <Muted>{row.itemCode}</Muted>
      </div>
    ),
  },
  {
    key: 'required',
    header: '소요량',
    numeric: true,
    render: (row) => formatQuantity(row.required, row.unit),
  },
  {
    key: 'allocated',
    header: '예약확보',
    numeric: true,
    render: (row) => (row.allocated === 0 ? dash : formatNumber(row.allocated)),
  },
  { key: 'available', header: '가용', numeric: true, render: (row) => formatNumber(row.available) },
  {
    key: 'incoming',
    header: '입고예정',
    numeric: true,
    render: (row) => (row.incoming === 0 ? dash : formatNumber(row.incoming)),
  },
  {
    key: 'shortage',
    header: '부족',
    numeric: true,
    render: (row) =>
      row.shortage > 0 ? <Shortfall>{formatNumber(row.shortage)}</Shortfall> : dash,
  },
]

export function OrderDetailDrawer({
  detail,
  onClose,
  onConfirm,
  onShip,
  onCancel,
}: OrderDetailDrawerProps) {
  const order = detail?.order

  return (
    <Drawer
      open={Boolean(detail)}
      onClose={onClose}
      title={order?.code ?? ''}
      description={order?.customerName}
      footer={
        order && (
          <>
            <Button variant="ghost" onClick={onClose}>
              닫기
            </Button>
            <Button
              variant="danger"
              disabled={!canCancel(order)}
              onClick={() => onCancel(order.id)}
            >
              취소
            </Button>
            <Button
              variant="secondary"
              disabled={!canConfirm(order)}
              onClick={() => onConfirm(order.id)}
            >
              확정 · 재고예약
            </Button>
            <Button disabled={!canShip(order)} onClick={() => onShip(order.id)}>
              출하
            </Button>
          </>
        )
      }
    >
      {detail && order && (
        <>
          <Meta>
            <Label>상태</Label>
            <Value>
              <StatusBadge descriptor={ORDER_STATUS[order.status]} size="sm" />
            </Value>

            <Label>출고창고</Label>
            <Value>{detail.warehouseName}</Value>

            <Label>수주일</Label>
            <Value>{formatDate(order.orderedAt)}</Value>

            <Label>납기</Label>
            <Value>
              {formatDate(order.dueDate)} <Muted>({formatDueLabel(order.dueDate)})</Muted>
            </Value>

            <Label>금액</Label>
            <Value>{formatCurrency(detail.totalAmount)}</Value>

            {order.memo && (
              <>
                <Label>메모</Label>
                <Value>{order.memo}</Value>
              </>
            )}
          </Meta>

          <Section>
            <SectionTitle>수주 품목</SectionTitle>
            <Bordered>
              <DataTable columns={lineColumns} data={detail.lines} rowKey={(line) => line.id} />
            </Bordered>
          </Section>

          <Section>
            <SectionTitle>번들 전개 · 재고 대조</SectionTitle>
            <SectionNote>
              번들을 실물 품목까지 펼친 소요량입니다. 예약확보는 이 수주가 이미 잡아둔 몫이고,
              부족은 지금 확정해도 채우지 못하는 수량입니다.
            </SectionNote>
            <Bordered>
              <DataTable
                columns={componentColumns}
                data={detail.components}
                rowKey={(row) => row.itemId}
              />
            </Bordered>
          </Section>
        </>
      )}
    </Drawer>
  )
}
