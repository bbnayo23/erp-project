import type { ISODateString } from '@/types'
import type { SelectOption } from '@/components/common/Select'

/**
 * 발주 생성 폼이 담당자에게 묻는 것.
 *
 * 대부분은 **묻지 않는다.** 품목유형이 문서구분을 정하고, 주문의 출고창고가 입고창고를
 * 정한다 — 규칙으로 정해진 값을 드롭다운으로 열면 담당자가 규칙을 깨는 선택을 할 수 있다.
 * 실제로 고를 수 있는 것은 수량 · 공급처 · 사용가능예정일 셋뿐이다.
 */
export interface IssueDraft {
  quantity: string
  supplierCode: string
  availableDate: string
  /** 만들자마자 확정할지. 확정해야 판정에 쓰인다. */
  confirmImmediately: boolean
}

/** 폼이 채워질 근거 — URL 로 넘어온 값에서 만든다 */
export interface IssueContext {
  itemCode: string
  itemName: string
  itemType: string
  /** 매입품 → 구매발주, 생산품 → 생산의뢰. 바꿀 수 없다. */
  documentTypeLabel: string
  warehouseCode: string
  warehouseName: string
  /** 이 발주를 낳은 주문 */
  sourceOrderId?: string
  /** 그 주문의 부족수량 — 기본 수량이 된다 */
  shortageQuantity: number
}

export interface IssuePageState {
  /** 폼을 채울 수 없는 경우(품목·창고를 못 찾음) null */
  context: IssueContext | null
  /** 못 채우는 이유 */
  problem?: string

  draft: IssueDraft
  setDraft: (patch: Partial<IssueDraft>) => void

  /** 문서구분에 맞는 공급처만 */
  supplierOptions: SelectOption[]
  /** 리드타임으로 계산한 기본 사용가능예정일 */
  suggestedDate: ISODateString

  /** 입력이 유효하지 않은 이유. 없으면 제출할 수 있다. */
  invalid?: string

  submit: () => void
  cancel: () => void
}
