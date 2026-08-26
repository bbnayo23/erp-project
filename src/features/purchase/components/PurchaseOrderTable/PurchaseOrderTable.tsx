import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { PurchaseOrderRow } from '@/features/purchase/types'
import { canReceive, formatProgress, PURCHASE_STATUS } from '@/features/purchase/utils'
import { formatDate } from '@/utils/date'
import { formatCurrency, formatNumber } from '@/utils/number'
import { Code, DateCell, Fill, ProgressCell, ProgressLabel, Track } from './styled'
import type { PurchaseOrderTableProps } from './types'

export function PurchaseOrderTable({ rows, onReceive }: PurchaseOrderTableProps) {
  // onReceive 를 클로저로 잡아야 하므로 컬럼을 컴포넌트 안에서 만든다
  const columns: DataTableColumn<PurchaseOrderRow>[] = [
    { key: 'code', header: '발주번호', render: (row) => <Code>{row.purchaseOrder.code}</Code> },
    { key: 'supplier', header: '공급처', render: (row) => row.purchaseOrder.supplier },
    { key: 'warehouse', header: '입고창고', render: (row) => row.warehouseName },
    {
      key: 'orderedAt',
      header: '발주일',
      render: (row) => formatDate(row.purchaseOrder.orderedAt),
    },
    {
      key: 'expectedDate',
      header: '입고예정일',
      render: (row) => (
        <DateCell>
          {formatDate(row.purchaseOrder.expectedDate)}
          {row.delayed && (
            <Badge tone="danger" variant="subtle" size="sm">
              지연
            </Badge>
          )}
        </DateCell>
      ),
    },
    {
      key: 'quantity',
      header: '입고/발주',
      numeric: true,
      render: (row) => `${formatNumber(row.receivedQuantity)} / ${formatNumber(row.totalQuantity)}`,
    },
    {
      key: 'progress',
      header: '진행',
      render: (row) => (
        <ProgressCell>
          <Track>
            <Fill $ratio={row.progress} />
          </Track>
          <ProgressLabel>{formatProgress(row.progress)}</ProgressLabel>
        </ProgressCell>
      ),
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
      render: (row) => (
        <StatusBadge descriptor={PURCHASE_STATUS[row.purchaseOrder.status]} size="sm" />
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          disabled={!canReceive(row.purchaseOrder.status) || row.progress >= 1}
          onClick={() => onReceive(row.purchaseOrder.id)}
        >
          입고
        </Button>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={(row) => row.purchaseOrder.id}
      emptyTitle="발주가 없습니다"
      emptyDescription="위 부족분 목록에서 발주를 생성해보세요."
      stickyHeader
    />
  )
}
