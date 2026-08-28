import type { ReactNode } from 'react'
import type { BadgeTone } from '@/components/common/Badge'

export type ColumnAlign = 'left' | 'center' | 'right'

/** 행 좌측 상태 레일의 색. 배지와 같은 톤 어휘를 쓴다 — 두 표시가 어긋나면 안 된다. */
export type RowTone = BadgeTone

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

/**
 * 행을 묶는 머리 줄.
 *
 * 표 밖에 그리지 않고 표의 행으로 둔다 — 밖에 두면 그룹마다 컬럼 정렬이 어긋난다.
 */
export interface DataTableGroup {
  key: string
  /** 머리 줄에 적을 것 */
  span: ReactNode
  /** 이 그룹에 속한 행 수. data 를 앞에서부터 이만큼씩 잘라 쓴다. */
  size: number
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  /**
   * 행을 묶어 머리 줄을 넣는다. 넘기지 않으면 평평한 표다.
   *
   * 그룹의 순서와 data 의 순서가 같아야 한다 — 표는 다시 정렬하지 않는다.
   */
  groups?: DataTableGroup[]
  rowKey: (row: T, index: number) => string
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  onRowClick?: (row: T, index: number) => void
  /**
   * 행 좌측에 상태 색 레일을 그린다.
   *
   * 배지를 읽지 않고도 어느 행이 손을 대야 하는 행인지 알 수 있어야 한다 — 26줄을
   * 훑을 때 담당자는 글자를 읽지 않고 색으로 먼저 걸러낸다.
   */
  rowTone?: (row: T, index: number) => RowTone | undefined
  /** 현재 선택된 row key 집합 — 하이라이트에만 사용 */
  selectedKeys?: ReadonlySet<string>
  /**
   * 헤더를 고정한다. 표 자체가 스크롤 영역이 되므로 `maxHeight` 를 함께 넘겨야 한다
   * (기본 640px). 페이지 스크롤에는 붙지 않는다 — Panel 이 내용을 클리핑하기 때문이다.
   */
  stickyHeader?: boolean
  /** stickyHeader 일 때 표 영역의 최대 높이 */
  maxHeight?: string
  className?: string
}
