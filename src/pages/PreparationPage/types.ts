import type { ISODateString } from '@/types'
import type { RowTone } from '@/components/common/DataTable'
import type { SelectOption } from '@/components/common/Select'
import type { SummaryCardItem } from '@/components/common/SummaryCards'
import type { PreparationFilter, PreparationRow } from '@/features/preparation/types'

/**
 * usePreparationPage 의 반환 형태.
 *
 * 화면이 쓸 값을 여기서 고정한다. 페이지 컴포넌트는 이 형태만 보고 그리므로,
 * 계산이 훅 밖으로 새는지 타입으로 드러난다.
 */
export interface PreparationPageState {
  /** 필터를 통과한 행 — 표에 그릴 것 */
  rows: PreparationRow[]
  /** 필터 이전의 전체 건수 — '5건 / 전체 23건' 표시에 쓴다 */
  totalCount: number

  filter: PreparationFilter
  setFilter: (patch: Partial<PreparationFilter>) => void
  resetFilter: () => void
  /** 필터가 하나라도 걸려 있는가 */
  filtered: boolean

  statusOptions: SelectOption[]
  reservedOptions: SelectOption[]
  warehouseOptions: SelectOption[]
  /** 계획에 실제로 있는 배송일만 */
  deliveryDateOptions: SelectOption[]

  /** 지표는 항상 전체를 센다. 누르면 그 지표로 표가 걸러진다. */
  summaryItems: SummaryCardItem[]
  /** 행 좌측 상태 레일 — 배지를 읽지 않고도 훑을 수 있어야 한다 */
  rowTone: (row: PreparationRow) => RowTone

  /** 04_재고현황 기준시각 — 화면에 '기준' 으로 표시한다 */
  baseAt: ISODateString
}
