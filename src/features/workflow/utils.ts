import type { ErpDatabase, ISODateString, PreparationStatus } from '@/types'
import type { PreparationPlan } from '@/domain/preparation/planPreparation'
import { calculateShortage } from '@/domain/purchase/calculateShortage'
import { getRemainingQuantity } from '@/domain/purchase/getRemainingQuantity'
import { stageOf } from '@/features/purchase/utils'
import { diffDays } from '@/utils/date'
import { sumBy } from '@/utils/number'
import type { WorkflowGuide, WorkflowStep } from './types'

/**
 * 계획과 입고예정 문서에서 '지금 할 일' 을 뽑는다.
 *
 * 판정은 하지 않는다 — 도메인이 낸 결과를 세고 순서를 붙이는 것뿐이다. 그래서 재고를
 * 바꾸면 이 목록도 자동으로 따라온다.
 */

type GuideContext = Pick<ErpDatabase, 'incomingDocuments'> & {
  plan: PreparationPlan
  baseAt: ISODateString
}

const countStatus = (plan: PreparationPlan, status: PreparationStatus): number =>
  plan.entries.filter((entry) => !entry.reserved && entry.preparation.status === status).length

export function buildWorkflowGuide({
  plan,
  incomingDocuments,
  baseAt,
}: GuideContext): WorkflowGuide {
  const stages = incomingDocuments.map((document) => ({
    document,
    stage: stageOf(document, baseAt),
  }))

  const inspect = stages.filter((row) => row.stage === 'INSPECT')
  const arrived = stages.filter((row) => row.stage === 'ARRIVED')

  const reservedCount = plan.entries.filter((entry) => entry.reserved).length
  const readyCount = countStatus(plan, 'READY')
  const exceptionCount = countStatus(plan, 'EXCEPTION')

  const shortageLines = calculateShortage(plan)
  const shortageQuantity = sumBy(shortageLines, (line) => line.shortageQuantity)
  const shortageOrders = countStatus(plan, 'SHORTAGE')

  /**
   * 사슬 순서대로 세운다. 조건을 만족하는 단계만 남긴다 — 0건 단계를 흐리게 남겨두면
   * 목록이 길어져서 정작 할 일이 눈에 안 들어온다.
   */
  const all: WorkflowStep[] = [
    {
      id: 'INSPECT',
      order: 1,
      chained: true,
      label: '품질검사 통과',
      count: inspect.length,
      why: '통과시키면 바로 입고할 수 있습니다. 검사 전 수량은 아직 현재고가 아닙니다.',
      tone: 'warning',
      icon: 'check',
      target: { kind: 'route', to: '/purchase', label: '발주 현황' },
    },
    {
      id: 'RECEIVE',
      order: 2,
      chained: true,
      label: '도착분 입고',
      count: arrived.length,
      quantity: sumBy(arrived, (row) => getRemainingQuantity(row.document)),
      why: '입고하면 현재고가 늘어 대기 중인 주문이 준비 완료로 다시 판정됩니다.',
      tone: 'primary',
      icon: 'purchase',
      target: { kind: 'route', to: '/purchase', label: '발주 현황' },
    },
    {
      id: 'RESERVE',
      order: 3,
      chained: true,
      label: '준비된 주문 예약',
      count: readyCount,
      why: '재고를 이 주문 몫으로 잡습니다. 예약하지 않으면 뒤 주문이 가져갈 수 있습니다.',
      tone: 'success',
      icon: 'orders',
      target: { kind: 'status', status: 'READY', label: '바로 준비 가능만 보기' },
    },
    {
      id: 'SHIP',
      order: 4,
      chained: true,
      label: '예약분 출고',
      count: reservedCount,
      why: '예약만 해두면 물건은 아직 창고에 있습니다. 출고해야 현재고가 줄어듭니다.',
      tone: 'primary',
      icon: 'arrowRight',
      target: { kind: 'reserved', label: '예약 완료만 보기' },
    },
    {
      id: 'ISSUE',
      order: 5,
      chained: false,
      label: '부족분 발주',
      count: shortageOrders,
      quantity: shortageQuantity,
      why: '오늘 재고가 늘지는 않지만, 리드타임이 있어 늦게 내면 납기를 맞출 수 없습니다.',
      tone: 'danger',
      icon: 'alert',
      target: { kind: 'status', status: 'SHORTAGE', label: '재고 부족만 보기' },
    },
    {
      id: 'RESOLVE',
      order: 6,
      chained: false,
      label: '확인 필요 데이터',
      count: exceptionCount,
      why: '자동으로 처리하지 않습니다. 데이터를 고쳐야 판정을 다시 할 수 있습니다.',
      tone: 'neutral',
      icon: 'clock',
      target: { kind: 'status', status: 'EXCEPTION', label: '확인 필요만 보기' },
    },
  ]

  const steps = all.filter((step) => step.count > 0)

  /**
   * 배송일이 오늘이거나 지났는데 아직 출고되지 않은 주문.
   * 사슬 순서보다 먼저 봐야 하므로 따로 센다 — 순서를 지키다 납기를 놓치면 안 된다.
   */
  const dueSoon = plan.entries.filter((entry) => diffDays(baseAt, entry.order.deliveryDate) <= 1)
  const overdue = dueSoon.filter((entry) => diffDays(baseAt, entry.order.deliveryDate) < 0).length

  return {
    steps,
    next: steps[0],
    urgent: dueSoon.length > 0 ? { count: dueSoon.length, overdue } : null,
    clear: steps.length === 0,
  }
}
