import { EmptyState } from '@/components/common/EmptyState'
import { Scroll, StateCell, Table, Td, Th, Tr } from './styled'
import type { DataTableColumn, DataTableProps } from './types'

/** 컬럼에 align 이 없으면 숫자 컬럼은 오른쪽, 나머지는 왼쪽 */
const alignOf = <T,>(column: DataTableColumn<T>) =>
  column.align ?? (column.numeric ? 'right' : 'left')

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyTitle = '데이터가 없습니다',
  emptyDescription,
  emptyAction,
  onRowClick,
  selectedKeys,
  stickyHeader = false,
  className,
}: DataTableProps<T>) {
  return (
    <Scroll className={className}>
      <Table>
        <thead>
          <tr>
            {columns.map((column) => (
              <Th
                key={column.key}
                scope="col"
                $align={alignOf(column)}
                $sticky={stickyHeader}
                $width={column.width}
              >
                {column.header}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <StateCell colSpan={columns.length}>
                <EmptyState
                  title={emptyTitle}
                  description={emptyDescription}
                  action={emptyAction}
                />
              </StateCell>
            </tr>
          )}

          {data.map((row, rowIndex) => {
            const key = rowKey(row, rowIndex)
            return (
              <Tr
                key={key}
                $clickable={Boolean(onRowClick)}
                $selected={selectedKeys?.has(key) ?? false}
                onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
              >
                {columns.map((column) => (
                  <Td key={column.key} $align={alignOf(column)} $numeric={column.numeric}>
                    {column.render
                      ? column.render(row, rowIndex)
                      : String((row as Record<string, unknown>)[column.key] ?? '')}
                  </Td>
                ))}
              </Tr>
            )
          })}
        </tbody>
      </Table>
    </Scroll>
  )
}
