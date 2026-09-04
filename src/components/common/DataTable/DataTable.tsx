import { Fragment } from 'react'
import { EmptyState } from '@/components/common/EmptyState'
import { GroupHead, Scroll, StateCell, Table, Td, Th, Tr } from './styled'
import type { DataTableColumn, DataTableProps } from './types'

/** 컬럼에 align 이 없으면 숫자 컬럼은 오른쪽, 나머지는 왼쪽 */
const alignOf = <T,>(column: DataTableColumn<T>) =>
  column.align ?? (column.numeric ? 'right' : 'left')

const DEFAULT_MAX_HEIGHT = '640px'

export const DataTable = <T,>({
  columns,
  data,
  groups,
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
}: DataTableProps<T>) => {
  /**
   * 행 하나.
   *
   * 그룹이 있든 없든 같은 함수로 그린다 — 두 갈래로 나누면 행 스타일이 갈라진다.
   * `index` 는 원본 데이터에서의 자리다. 그룹으로 잘라 그려도 rowTone·onRowClick 이
   * 받는 번호가 목록 전체 기준이어야 호출부가 헷갈리지 않는다.
   */
  const renderRow = (row: T, index: number) => {
    const key = rowKey(row, index)
    const activate = onRowClick ? () => onRowClick(row, index) : undefined

    return (
      <Tr
        key={key}
        $clickable={Boolean(activate)}
        $selected={selectedKeys?.has(key) ?? false}
        $tone={rowTone?.(row, index)}
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
              ? column.render(row, index)
              : String((row as Record<string, unknown>)[column.key] ?? '')}
          </Td>
        ))}
      </Tr>
    )
  }

  /**
   * 그룹 머리 줄을 사이에 끼운다.
   *
   * `data` 를 앞에서부터 `size` 만큼 잘라 쓴다. 다시 정렬하지 않는 이유는 목록 순서
   * 자체가 의미를 갖는 화면이 있기 때문이다 — 주문 목록의 순서는 재고를 배정받은
   * 순서다.
   */
  const renderGrouped = () => {
    let from = 0

    return groups!.map((group) => {
      const slice = data.slice(from, from + group.size)
      const start = from
      from += group.size

      return (
        <Fragment key={group.key}>
          <tr>
            <GroupHead scope="colgroup" colSpan={columns.length}>
              {group.span}
            </GroupHead>
          </tr>
          {slice.map((row, index) => renderRow(row, start + index))}
        </Fragment>
      )
    })
  }

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

          {groups ? renderGrouped() : data.map((row, index) => renderRow(row, index))}
        </tbody>
      </Table>
    </Scroll>
  )
}
