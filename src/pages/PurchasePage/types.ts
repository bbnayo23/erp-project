import type { ISODateString } from '@/types'
import type { RowTone } from '@/components/common/DataTable'
import type { SelectOption } from '@/components/common/Select'
import type { SummaryCardItem } from '@/components/common/SummaryCards'
import type { IncomingRow, PurchaseFilter, ReceiptHistoryRow } from '@/features/purchase/types'
import type { ReceiptDraft } from '@/features/purchase/ReceiveModal'

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

  /**
   * 열려 있는 입고 모달의 문서. 닫혀 있으면 null.
   *
   * URL(`/inbound/:documentId`)이 이 값을 정한다 — 딥링크로 바로 열 수 있어야
   * 다른 화면에서 '이 문서 보기' 로 건너올 수 있다.
   */
  openDocument: IncomingRow | null
  /** 자동 채번한 시리얼번호 — 담당자가 고칠 수 있다 */
  suggestedSerials: string[]
  /** 열린 문서가 시리얼 관리 품목인가 */
  serialManaged: boolean

  openReceipt: (documentId: string) => void
  closeReceipt: () => void
  submitReceipt: (draft: ReceiptDraft) => void

  /** 미확정 문서를 확정한다 */
  confirm: (documentId: string) => void

  /** 입고 처리 이력 — 방금 처리한 것이 위로 온다 */
  history: ReceiptHistoryRow[]

  /** 07_입고예정의 '오늘' — 도착 지연 판정의 기준이다 */
  baseAt: ISODateString
}
