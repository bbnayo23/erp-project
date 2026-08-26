import { Badge } from '@/components/common/Badge'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { OrderRow } from '@/features/orders/types'
import { ORDER_STATUS } from '@/features/orders/utils'
import { formatDate, formatDueLabel } from '@/utils/date'
import { formatCurrency, formatNumber } from '@/utils/number'
import { Code, Customer, DueCell, Muted } from './styled'
import type { OrderTableProps } from './types'

const columns: DataTableColumn<OrderRow>[] = [
  { key: 'code', header: '수주번호', render: (row) => <Code>{row.order.code}</Code> },
  {
    key: 'customer',
    header: '고객',
    render: (row) => <Customer>{row.order.customerName}</Customer>,
  },
  { key: 'warehouse', header: '출고창고', render: (row) => row.warehouseName },
  { key: 'orderedAt', header: '수주일', render: (row) => formatDate(row.order.orderedAt) },
  {
    key: 'dueDate',
    header: '납기',
    render: (row) => (
      <DueCell>
        {formatDate(row.order.dueDate)}
        {row.overdue ? (
          <Badge tone="danger" variant="subtle" size="sm">
            {formatDueLabel(row.order.dueDate)}
          </Badge>
        ) : (
          <Muted>{formatDueLabel(row.order.dueDate)}</Muted>
        )}
      </DueCell>
    ),
  },
  {
    key: 'totalQuantity',
    header: '수량',
    numeric: true,
    render: (row) => formatNumber(row.totalQuantity),
  },
  {
    key: 'totalAmount',
    header: '금액',
    numeric: true,
    render: (row) => formatCurrency(row.totalAmount),
  },
  {
    key: 'status',
    header: '상태',
    render: (row) => <StatusBadge descriptor={ORDER_STATUS[row.order.status]} size="sm" />,
  },
]

export function OrderTable({ rows, selectedOrderId, onSelect }: OrderTableProps) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={(row) => row.order.id}
      selectedKeys={selectedOrderId ? new Set([selectedOrderId]) : undefined}
      onRowClick={(row) => onSelect(row.order.id)}
      emptyTitle="조건에 맞는 수주가 없습니다"
      emptyDescription="검색어나 상태 필터를 바꿔보세요."
      stickyHeader
    />
  )
}
