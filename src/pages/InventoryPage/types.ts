import type { ISODateString } from '@/types'
import type { RowTone } from '@/components/common/DataTable'
import type { SelectOption } from '@/components/common/Select'
import type { SummaryCardItem } from '@/components/common/SummaryCards'
import type {
  InventoryFilter,
  ItemDemandRow,
  ItemDocumentRow,
  SerialRow,
  StockMovementRow,
  StockRow,
} from '@/features/inventory/types'

/**
 * 품목 상세 서랍의 내용.
 *
 * 재고 숫자 하나를 보고 담당자가 이어서 묻는 것은 셋이다 — 이 개체들은 어디에 있는가,
 * 누가 이 물건을 기다리는가, 무엇이 들어오기로 되어 있는가. 세 답을 한 서랍에 모은다.
 */
export interface StockDetailState {
  row: StockRow
  serials: SerialRow[]
  /** 이 품목·창고를 기다리는 준비 대상 주문 */
  demands: ItemDemandRow[]
  /** 이 품목·창고로 걸려 있는 발주·생산의뢰 */
  documents: ItemDocumentRow[]
  /** 이 품목·창고의 재고가 움직인 이력 */
  movements: StockMovementRow[]
}

/**
 * useInventoryPage 의 반환 형태.
 *
 * 화면이 쓸 값을 여기서 고정한다. 페이지 컴포넌트는 이 형태만 보고 그리므로,
 * 계산이 훅 밖으로 새는지 타입으로 드러난다.
 */
export interface InventoryPageState {
  /** 필터를 통과한 행 — 표에 그릴 것 */
  rows: StockRow[]
  /** 필터 이전의 전체 건수 — '4건 / 전체 20건' 표시에 쓴다 */
  totalCount: number

  filter: InventoryFilter
  setFilter: (patch: Partial<InventoryFilter>) => void
  resetFilter: () => void
  /** 필터가 하나라도 걸려 있는가 */
  filtered: boolean

  levelOptions: SelectOption[]
  warehouseOptions: SelectOption[]

  /** 요약은 항상 전체를 센다. 상태 카드는 누르면 표가 걸러진다. */
  summaryItems: SummaryCardItem[]
  /** 행 좌측 상태 레일 — 개체 불일치 행은 재고 상태와 무관하게 붉게 선다 */
  rowTone: (row: StockRow) => RowTone

  /** 열려 있는 품목 상세 서랍. 닫혀 있으면 null */
  drawer: StockDetailState | null
  openDetail: (row: StockRow) => void
  closeDetail: () => void

  /** 전체 재고 변동 이력 — 방금 처리한 것이 위로 온다 */
  movements: StockMovementRow[]

  /** 04_재고현황 기준시각 — 어느 시점의 재고를 보고 있는지 */
  baseAt: ISODateString
}
