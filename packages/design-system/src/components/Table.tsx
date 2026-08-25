import type { ReactNode } from 'react'
import styled, { css } from 'styled-components'
import { EmptyState } from './EmptyState'
import { Spinner } from './Spinner'

export type ColumnAlign = 'left' | 'center' | 'right'

export interface TableColumn<T> {
  /** row 객체의 키이거나, render 를 쓸 때는 임의의 고유 문자열 */
  key: string
  header: ReactNode
  width?: string
  align?: ColumnAlign
  /** 셀 렌더러. 없으면 row[key] 를 그대로 출력한다. */
  render?: (row: T, rowIndex: number) => ReactNode
  /** 금액/수량처럼 자릿수 정렬이 필요한 컬럼 */
  numeric?: boolean
}

export interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  rowKey: (row: T, index: number) => string
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  onRowClick?: (row: T, index: number) => void
  /** 현재 선택된 row key 집합 — 하이라이트에만 사용 */
  selectedKeys?: ReadonlySet<string>
  /** 헤더 고정 (부모에 max-height 필요) */
  stickyHeader?: boolean
  className?: string
}

const Scroll = styled.div`
  width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
`

const StyledTable = styled.table`
  width: 100%;
  min-width: max-content;
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.colors.text};
`

const Th = styled.th<{ $align: ColumnAlign; $sticky: boolean; $width?: string }>`
  position: ${({ $sticky }) => ($sticky ? 'sticky' : 'static')};
  top: 0;
  z-index: ${({ theme, $sticky }) => ($sticky ? theme.zIndex.sticky : 'auto')};
  width: ${({ $width }) => $width ?? 'auto'};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  text-align: ${({ $align }) => $align};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-bottom: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme }) => theme.colors.border};
`

const Td = styled.td<{ $align: ColumnAlign; $numeric?: boolean }>`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  text-align: ${({ $align }) => $align};
  border-bottom: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme }) => theme.colors.border};
  vertical-align: middle;

  ${({ $numeric }) =>
    $numeric &&
    css`
      font-variant-numeric: tabular-nums;
      font-feature-settings: 'tnum';
    `}
`

const Tr = styled.tr<{ $clickable: boolean; $selected: boolean }>`
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.surfaceSelected : theme.colors.surface};
  transition: background-color ${({ theme }) => theme.duration.fast}
    ${({ theme }) => theme.easing.standard};

  ${({ $clickable, theme, $selected }) =>
    $clickable &&
    css`
      cursor: pointer;

      &:hover {
        background: ${$selected ? theme.colors.surfaceSelected : theme.colors.surfaceHover};
      }
    `}

  &:last-child td {
    border-bottom: 0;
  }
`

const StateCell = styled.td`
  padding: 0;
`

const LoadingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[12]};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.font.size.sm};
`

export function Table<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyTitle = '데이터가 없습니다',
  emptyDescription,
  emptyAction,
  onRowClick,
  selectedKeys,
  stickyHeader = false,
  className,
}: TableProps<T>) {
  const showEmpty = !loading && data.length === 0

  return (
    <Scroll className={className}>
      <StyledTable>
        <thead>
          <tr>
            {columns.map((column) => (
              <Th
                key={column.key}
                scope="col"
                $align={column.align ?? (column.numeric ? 'right' : 'left')}
                $sticky={stickyHeader}
                $width={column.width}
              >
                {column.header}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <StateCell colSpan={columns.length}>
                <LoadingRow>
                  <Spinner size="sm" />
                  불러오는 중…
                </LoadingRow>
              </StateCell>
            </tr>
          )}

          {showEmpty && (
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

          {!loading &&
            data.map((row, rowIndex) => {
              const key = rowKey(row, rowIndex)
              return (
                <Tr
                  key={key}
                  $clickable={Boolean(onRowClick)}
                  $selected={selectedKeys?.has(key) ?? false}
                  onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                >
                  {columns.map((column) => (
                    <Td
                      key={column.key}
                      $align={column.align ?? (column.numeric ? 'right' : 'left')}
                      $numeric={column.numeric}
                    >
                      {column.render
                        ? column.render(row, rowIndex)
                        : String((row as Record<string, unknown>)[column.key] ?? '')}
                    </Td>
                  ))}
                </Tr>
              )
            })}
        </tbody>
      </StyledTable>
    </Scroll>
  )
}
