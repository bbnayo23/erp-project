import { EmptyState } from '@/components/common/EmptyState'
import { Scroll, StateCell, Table, Td, Th, Tr } from './styled'
import type { DataTableColumn, DataTableProps } from './types'

/** 컬럼에 align 이 없으면 숫자 컬럼은 오른쪽, 나머지는 왼쪽 */
const alignOf = <T,>(column: DataTableColumn<T>) =>
  column.align ?? (column.numeric ? 'right' : 'left')

const DEFAULT_MAX_HEIGHT = '640px'

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyTitle = '데이터가 없습니다',
  emptyDescription,
  emptyAction,
  onRowClick,
  rowTone,
  selectedKeys,
  stickyHeader = false,
  maxHeight,
  className,
}: DataTableProps<T>) {
  return (
    <Scroll
      className={className}
      $maxHeight={stickyHeader ? (maxHeight ?? DEFAULT_MAX_HEIGHT) : maxHeight}
    >
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
            const activate = onRowClick ? () => onRowClick(row, rowIndex) : undefined

            return (
              <Tr
                key={key}
                $clickable={Boolean(activate)}
                $selected={selectedKeys?.has(key) ?? false}
                $tone={rowTone?.(row, rowIndex)}
                onClick={activate}
                /*
                 * 행이 상세로 가는 유일한 길인 화면이 있어 마우스 없이도 닿아야 한다.
                 * role 은 덮어쓰지 않는다 — tr 에 role="button" 을 주면 암묵적 row 역할이
                 * 사라져 스크린리더가 표를 표로 읽지 못하고, 행/열 탐색도 끊긴다.
                 */
                tabIndex={activate ? 0 : undefined}
                onKeyDown={
                  activate
                    ? (event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return
                        // Space 는 페이지를 스크롤시키므로 기본 동작을 막는다
                        event.preventDefault()
                        activate()
                      }
                    : undefined
                }
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
