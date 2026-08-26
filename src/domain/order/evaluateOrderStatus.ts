import type {
  AllocationLine,
  AllocationResult,
  DemandLine,
  Order,
  OrderStatus,
} from '@/features/orders/types'

/** 더 이상 상태가 바뀌지 않는 종결 상태 */
const TERMINAL: readonly OrderStatus[] = ['SHIPPED', 'CANCELLED']

export const isTerminalStatus = (status: OrderStatus) => TERMINAL.includes(status)

/**
 * 예약 결과로 수주 상태를 정한다.
 *
 * 상태를 저장값이 아니라 예약 결과에서 유도하면, 재고가 나중에 채워졌을 때
 * 재평가만으로 PARTIALLY_ALLOCATED → ALLOCATED 로 올라간다.
 */
export function evaluateOrderStatus(order: Order, allocation: AllocationResult): OrderStatus {
  if (isTerminalStatus(order.status)) return order.status
  if (allocation.lines.length === 0) return order.status
  if (allocation.fullyAllocated) return 'ALLOCATED'
  if (allocation.nothingAllocated) return 'CONFIRMED'
  return 'PARTIALLY_ALLOCATED'
}

/** 출하 가능한 상태인가 — 전량 예약된 수주만 내보낸다 */
export const canShip = (order: Order) => order.status === 'ALLOCATED'

/** 취소 가능한 상태인가 */
export const canCancel = (order: Order) => !isTerminalStatus(order.status)

/** 확정(예약 시도) 가능한 상태인가 */
export const canConfirm = (order: Order) =>
  order.status === 'DRAFT' || order.status === 'CONFIRMED' || order.status === 'PARTIALLY_ALLOCATED'

/**
 * 누적 예약 기준으로 상태를 평가할 AllocationResult 를 만든다.
 *
 * 한 번의 예약 결과만 보면, 이미 전량 예약된 수주를 다시 확정했을 때
 * "이번에 잡은 게 없다" 는 이유로 CONFIRMED 로 되돌아간다.
 */
export function toCumulativeAllocation(
  demand: readonly DemandLine[],
  held: readonly DemandLine[],
): AllocationResult {
  const heldMap = new Map(held.map((line) => [line.itemId, line.quantity]))

  const lines: AllocationLine[] = demand.map((line) => {
    const allocated = Math.min(line.quantity, heldMap.get(line.itemId) ?? 0)
    return {
      itemId: line.itemId,
      required: line.quantity,
      allocated,
      shortage: line.quantity - allocated,
    }
  })

  return {
    lines,
    fullyAllocated: lines.length > 0 && lines.every((line) => line.shortage === 0),
    nothingAllocated: lines.every((line) => line.allocated === 0),
  }
}
