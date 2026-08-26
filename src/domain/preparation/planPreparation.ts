import type { ErpDatabase, Order, OrderId, OrderPreparation } from '@/types'
import { createAllocationLedger } from './allocationLedger'
import { evaluateOrder, type EvaluateOrderContext } from './evaluateOrder'
import { isPreparationTarget } from './preparationRules'
import { findReservation, preparationFromReservation } from './reservedPreparation'
import { sortOrdersByPriority } from './sortOrdersByPriority'

export type PlanPreparationContext = EvaluateOrderContext &
  Pick<ErpDatabase, 'orders' | 'reservations'>

export interface PreparationPlanEntry {
  /** 1부터. 이 순서로 재고를 나눠 가졌다. */
  priority: number
  order: Order
  preparation: OrderPreparation
  /** 예약을 마쳐 배정 경쟁에서 빠진 주문 — 다음 행동은 피킹·출고다 */
  reserved: boolean
}

export interface PreparationPlan {
  entries: PreparationPlanEntry[]
}

/**
 * 준비 대상 주문 전체를 우선순위대로 판정한다. 목록 화면이 쓰는 함수다.
 *
 * 주문을 하나씩 따로 판정하면 안 된다. 같은 가용재고를 여러 주문이 각각 전부 쓸 수 있다고
 * 보게 되어, 화면에는 '바로 준비 가능' 이 여러 건인데 실제로는 한 건만 나가는 상태가 된다.
 *
 * 그래서 원장을 한 번만 만들어 배송일 순서대로 물려준다 (가이드 §6).
 * 앞선 주문이 배정한 현재고와 입고예정은 원장에서 빠지므로 뒤 주문이 다시 쓸 수 없다.
 *
 * 준비 대상이 아닌 주문(취소·출고 완료·배송 완료)은 애초에 제외한다. 판정에 넣으면
 * ORDER_NOT_CONFIRMED 로 EXCEPTION 이 되어 진짜 데이터 오류와 섞인다.
 *
 * 이미 예약된 주문은 목록에 남기지만 원장을 건드리지 않는다. 예약수량은 이미 다른 주문의
 * 가용재고에서 빠져 있어 물량이 확보된 상태이고, 다시 배정하면 자기 예약 때문에 자기가
 * 부족해진다 (reservedPreparation).
 */
export function planPreparation(ctx: PlanPreparationContext): PreparationPlan {
  const ledger = createAllocationLedger(ctx)

  const entries = sortOrdersByPriority(
    ctx.orders.filter(isPreparationTarget),
  ).map<PreparationPlanEntry>((order, index) => {
    const reservation = findReservation(ctx.reservations, order.orderId)

    return {
      priority: index + 1,
      order,
      preparation: reservation
        ? preparationFromReservation(reservation)
        : evaluateOrder(ctx, order, ledger),
      reserved: reservation !== undefined,
    }
  })

  return { entries }
}

export const findPlanEntry = (
  plan: PreparationPlan,
  orderId: OrderId,
): PreparationPlanEntry | undefined => plan.entries.find((entry) => entry.order.orderId === orderId)

/**
 * 입고로 재고가 늘었을 때 대기 중인 주문을 다시 판정한다 (가이드 §18).
 *
 * 입고는 단순한 재고 증가가 아니라 대기 주문을 풀어주는 트리거다. 전체를 다시 계획하는
 * 것과 같은 일이지만, 이름을 따로 두어 호출부의 의도가 드러나게 한다.
 *
 * 한 주문만 다시 판정하면 안 된다. 늘어난 재고를 배송일이 더 빠른 다른 대기 주문이
 * 먼저 가져가야 할 수 있다.
 */
export const reevaluateWaitingOrders = (ctx: PlanPreparationContext): PreparationPlan =>
  planPreparation(ctx)
