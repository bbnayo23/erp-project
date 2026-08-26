import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { InventoryRow } from '@/features/inventory/types'
import { ITEM_TYPE_LABEL, STOCK_LEVEL_STATUS } from '@/features/inventory/utils'
import { formatDate } from '@/utils/date'
import { formatNumber } from '@/utils/number'
import { ItemCell, ItemCode, ItemName, Muted, Shortfall } from './styled'
import type { InventoryTableProps } from './types'

const dash = <Muted>-</Muted>

const columns: DataTableColumn<InventoryRow>[] = [
  {
    key: 'item',
    header: '품목',
    render: (row) => (
      <ItemCell>
        <ItemName>{row.itemName}</ItemName>
        <ItemCode>
          {row.itemCode} · {ITEM_TYPE_LABEL[row.itemType]}
        </ItemCode>
      </ItemCell>
    ),
  },
  { key: 'warehouseName', header: '창고', render: (row) => row.warehouseName },
  { key: 'onHand', header: '실물', numeric: true, render: (row) => formatNumber(row.onHand) },
  {
    key: 'reserved',
    header: '예약',
    numeric: true,
    render: (row) => (row.reserved === 0 ? dash : formatNumber(row.reserved)),
  },
  { key: 'available', header: '가용', numeric: true, render: (row) => formatNumber(row.available) },
  {
    key: 'safetyStock',
    header: '안전재고',
    numeric: true,
    render: (row) => <Muted>{formatNumber(row.safetyStock)}</Muted>,
  },
  {
    key: 'demand',
    header: '소요량',
    numeric: true,
    render: (row) => (row.demand === 0 ? dash : formatNumber(row.demand)),
  },
  {
    key: 'incoming',
    header: '입고예정',
    numeric: true,
    render: (row) => (row.incoming === 0 ? dash : formatNumber(row.incoming)),
  },
  {
    key: 'gap',
    header: '부족',
    numeric: true,
    render: (row) => {
      const gap = row.demand - row.available - row.incoming
      return gap > 0 ? <Shortfall>{formatNumber(gap)}</Shortfall> : dash
    },
  },
  {
    key: 'level',
    header: '상태',
    render: (row) => <StatusBadge descriptor={STOCK_LEVEL_STATUS[row.level]} size="sm" />,
  },
  {
    key: 'updatedAt',
    header: '기준일',
    render: (row) => <Muted>{formatDate(row.updatedAt)}</Muted>,
  },
]

export function InventoryTable({ rows }: InventoryTableProps) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={(row) => `${row.itemId}:${row.warehouseId}`}
      emptyTitle="조건에 맞는 재고가 없습니다"
      emptyDescription="검색어나 창고 필터를 바꿔보세요."
      stickyHeader
    />
  )
}
