import type { ISODateString } from '@/types'
import type { RowTone } from '@/components/common/DataTable'
import type { NoticeTone } from '@/components/common/Notice'
import type { SelectOption } from '@/components/common/Select'
import type { SummaryCardItem } from '@/components/common/SummaryCards'
import type { IncomingRow, PurchaseFilter } from '@/features/purchase/types'

export interface PurchaseNotice {
  tone: NoticeTone
  message: string
}

/**
 * usePurchasePage 의 반환 형태.
 *
 * 화면이 쓸 값을 여기서 고정한다. 페이지 컴포넌트는 이 형태만 보고 그리므로,
 * 계산이 훅 밖으로 새는지 타입으로 드러난다.
 */
export interface PurchasePageState {
  /** 필터를 통과한 행 — 표에 그릴 것 */
  rows: IncomingRow[]
  /** 필터 이전의 전체 건수 — '3건 / 전체 12건' 표시에 쓴다 */
  totalCount: number

  filter: PurchaseFilter
  setFilter: (patch: Partial<PurchaseFilter>) => void
  resetFilter: () => void
  /** 필터가 하나라도 걸려 있는가 */
  filtered: boolean

  stageOptions: SelectOption[]
  documentTypeOptions: SelectOption[]
  warehouseOptions: SelectOption[]

  /** 요약은 항상 전체를 센다. 누르면 그 단계로 표가 걸러진다. */
  summaryItems: SummaryCardItem[]
  /** 행 좌측 상태 레일 — 지연된 문서는 단계와 무관하게 붉게 선다 */
  rowTone: (row: IncomingRow) => RowTone

  notice: PurchaseNotice | null
  dismissNotice: () => void

  /** 입고 수량 입력 — 문서별로 들고 있는다 */
  receiptQuantity: (documentId: string) => string
  setReceiptQuantity: (documentId: string, value: string) => void
  receive: (documentId: string) => void
  inspect: (documentId: string) => void

  /** 07_입고예정의 '오늘' — 도착 지연 판정의 기준이다 */
  baseAt: ISODateString
}
