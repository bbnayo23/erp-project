import type { Order } from '@/types'
import { compareIso } from '@/utils/date'

/**
 * 준비 우선순위 비교자.
 *
 *   1순위 배송예정일이 빠른 주문
 *   2순위 배송예정일이 같으면 주문접수일시가 빠른 주문
 *   3순위 둘 다 같으면 주문번호
 *
 * 3순위는 업무 규칙이 아니라 결정성을 위한 것이다. 동순위가 실행마다 다른 순서로
 * 배정되면 같은 데이터에서 다른 판정이 나오고, 테스트도 재고 정합성도 믿을 수 없다.
 */
export const comparePriority = (a: Order, b: Order): number =>
  compareIso(a.deliveryDate, b.deliveryDate) ||
  compareIso(a.orderedAt, b.orderedAt) ||
  a.orderId.localeCompare(b.orderId)

/**
 * 배송일 · 주문접수일시 순으로 정렬한다 (가이드 §6).
 *
 * 이 순서가 재고를 나눠 갖는 순서다. 앞선 주문이 배정한 현재고와 입고예정은 뒤 주문이
 * 다시 쓸 수 없다 — planPreparation 이 이 순서로 원장을 차감한다.
 *
 * 입력 배열은 건드리지 않는다. Array.sort 는 제자리 정렬이라 원본을 흐트러뜨린다.
 */
export const sortOrdersByPriority = (orders: readonly Order[]): Order[] =>
  [...orders].sort(comparePriority)
