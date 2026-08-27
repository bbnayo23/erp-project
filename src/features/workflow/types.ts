import type { ISODateString, PreparationStatus, Quantity } from '@/types'
import type { BadgeTone } from '@/components/common/Badge'
import type { IconName } from '@/components/common/Icon'

/**
 * 담당자가 지금 할 수 있는 작업 한 가지.
 *
 * 순서에 업무적 근거가 있다. 앞 네 단계는 사슬이다 — 검사를 통과시키면 입고할 수 있고,
 * 입고하면 대기 중이던 주문이 준비 완료로 바뀌어 예약할 수 있고, 예약하면 출고할 수 있다.
 * 각 단계가 다음 단계의 대상을 늘리므로 거꾸로 하면 같은 화면을 두 번 훑어야 한다.
 *
 * 발주와 확인 필요는 사슬에서 빠진 가지다. 오늘 재고를 늘려주지 않지만, 발주는 늦으면
 * 납기를 못 맞추고 확인 필요는 아무도 손대지 않으면 계속 남는다.
 */
export type WorkflowStepId =
  /** 검사 대기 문서를 통과시킨다 */
  | 'INSPECT'
  /** 도착한 물량을 입고한다 — 현재고가 늘어 대기 주문이 풀린다 */
  | 'RECEIVE'
  /** 준비된 주문의 재고를 확정한다 */
  | 'RESERVE'
  /** 예약한 주문을 내보낸다 */
  | 'SHIP'
  /** 부족분을 발주한다 */
  | 'ISSUE'
  /** 판정할 수 없는 주문의 데이터를 고친다 */
  | 'RESOLVE'

/** 이 작업을 하는 곳. 같은 화면이면 필터를 걸고, 다른 화면이면 이동한다. */
export type WorkflowTarget =
  | { kind: 'route'; to: string; label: string }
  | { kind: 'status'; status: PreparationStatus; label: string }
  | { kind: 'reserved'; label: string }

export interface WorkflowStep {
  id: WorkflowStepId
  /** 사슬에서의 자리 (1부터). 가지 단계는 사슬 뒤 번호를 이어받는다. */
  order: number
  /** 사슬에 속한 단계인가 — 앞 단계를 하면 이 단계의 대상이 늘어난다 */
  chained: boolean

  label: string
  count: number
  /** 건수 외에 같이 보여줄 수량 (부족분 개수 등) */
  quantity?: Quantity
  /** 왜 지금 이걸 하는가 — 순서의 근거 */
  why: string

  tone: BadgeTone
  icon: IconName
  target: WorkflowTarget
}

export interface WorkflowGuide {
  /** 처리할 것이 남은 단계만. 0건 단계는 담당자의 시야에서 빼야 목록이 짧아진다. */
  steps: WorkflowStep[]
  /** 지금 손대야 하는 첫 단계 */
  next?: WorkflowStep
  /** 배송일이 오늘이거나 지났는데 아직 못 나간 주문 — 순서를 무시하고 먼저 봐야 한다 */
  urgent: { count: number; overdue: number } | null
  /** 남은 작업이 없다 */
  clear: boolean
}

export interface WorkflowGuideProps {
  guide: WorkflowGuide
  /** 어느 시점 기준의 할 일인지 밝힌다 */
  baseAt: ISODateString
  /** 카드를 눌렀을 때 — 페이지가 필터를 걸거나 이동한다 */
  onSelect: (step: WorkflowStep) => void
}
