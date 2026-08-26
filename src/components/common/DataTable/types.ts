import type { ReactNode } from 'react'

export type ColumnAlign = 'left' | 'center' | 'right'

export interface DataTableColumn<T> {
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

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (row: T, index: number) => string
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
