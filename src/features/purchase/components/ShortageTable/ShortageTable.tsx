import { Badge } from '@/components/common/Badge'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import type { ShortageRow } from '@/features/purchase/types'
import { formatCurrency, formatNumber, formatQuantity } from '@/utils/number'
import { ItemCell, ItemCode, ItemName, Muted, Shortfall } from './styled'
import type { ShortageTableProps } from './types'

const columns: DataTableColumn<ShortageRow>[] = [
  {
    key: 'item',
    header: '품목',
    render: (row) => (
      <ItemCell>
        <ItemName>{row.itemName}</ItemName>
        <ItemCode>{row.itemCode}</ItemCode>
      </ItemCell>
    ),
  },
  {
    key: 'supplier',
    header: '공급처',
    render: (row) => (
      <Badge tone="neutral" variant="outline" size="sm">
        {row.supplier}
      </Badge>
    ),
  },
  { key: 'required', header: '소요량', numeric: true, render: (row) => formatNumber(row.required) },
  {
    key: 'safetyStock',
    header: '안전재고',
    numeric: true,
    render: (row) => <Muted>{formatNumber(row.safetyStock)}</Muted>,
  },
  { key: 'available', header: '가용', numeric: true, render: (row) => formatNumber(row.available) },
  {
    key: 'incoming',
    header: '입고예정',
    numeric: true,
    render: (row) => (row.incoming === 0 ? <Muted>-</Muted> : formatNumber(row.incoming)),
  },
  {
    key: 'shortage',
    header: '부족(발주수량)',
    numeric: true,
    render: (row) => <Shortfall>{formatQuantity(row.shortage, row.unit)}</Shortfall>,
  },
  {
    key: 'leadTimeDays',
    header: '리드타임',
    numeric: true,
    render: (row) => <Muted>{row.leadTimeDays}일</Muted>,
  },
  {
    key: 'estimatedAmount',
    header: '예상금액',
    numeric: true,
    render: (row) => formatCurrency(row.estimatedAmount),
  },
]

export function ShortageTable({ rows }: ShortageTableProps) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={(row) => `${row.itemId}:${row.warehouseId}`}
      emptyTitle="부족분이 없습니다"
      emptyDescription="현재 미결 수주는 가용 재고와 입고예정으로 모두 덮을 수 있습니다."
      stickyHeader
    />
  )
}
