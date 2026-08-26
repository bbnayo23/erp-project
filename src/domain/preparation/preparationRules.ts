import type { Order, OrderPreparation, PreparationStatus } from '@/types'

/**
 * 준비 판정에 관한 술어들. 타입 말고는 아무것도 import 하지 않는다.
 *
 * 판정 본체(evaluateOrder)와 떼어 둔 이유: reserveOrder 같은 하위 계층이 `canReserve`
 * 하나 때문에 판정 로직 전체를 끌어오면 의존이 뒤엉킨다.
 */

/**
 * 새 출고 준비 대상인가 (00_안내: 주문 확정 상태의 정상 품목만 대상).
 *
 * 목록 화면은 이 함수로 먼저 걸러야 한다. 완료·취소 주문까지 evaluateOrder 에 넣으면
 * ORDER_NOT_CONFIRMED 로 EXCEPTION 이 되어, 데이터 오류(미등록 품목·사용 중지 창고)와
 * 한 덩어리로 보이게 된다.
 */
export const isPreparationTarget = (order: Order): boolean => order.status === '주문 확정'

/** 준비 판정이 READY 인 주문만 예약할 수 있다 (00_안내: 전량 준비 가능할 때만 예약) */
export const canReserve = (preparation: OrderPreparation): boolean => preparation.status === 'READY'

/** 나쁜 순서. 주문 상태는 품목 중 가장 나쁜 것을 따른다. */
const SEVERITY: Record<PreparationStatus, number> = {
  READY: 0,
  WAITING: 1,
  SHORTAGE: 2,
  EXCEPTION: 3,
}

export const worstStatus = (statuses: readonly PreparationStatus[]): PreparationStatus =>
  statuses.reduce<PreparationStatus>(
    (acc, status) => (SEVERITY[status] > SEVERITY[acc] ? status : acc),
    'READY',
  )
