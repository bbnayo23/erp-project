import type { DemandLine, ErpDatabase, ItemCode, Order } from '@/types'
import { expandBundleLines } from './expandBundle'

export type DemandContext = Pick<ErpDatabase, 'items' | 'bundleComponents'>

export interface OrderDemand {
  /** 세트를 풀고 서비스를 걷어낸 실물 품목 소요량 */
  lines: DemandLine[]
  unknownItemCodes: ItemCode[]
  excludedItemCodes: ItemCode[]
  /** 수량이 0 이하인 품목 — 데이터 오류다 */
  invalidQuantityItemCodes: ItemCode[]
}

/**
 * 주문 한 건의 실물 품목 소요량.
 *
 * '취소' 품목은 제외한다 — 주문은 살아 있고 품목만 빠지는 경우가 있다 (ORD202607200003 3번).
 * 주문상태 자체가 준비 대상인지는 evaluateOrder 가 판단한다.
 */
export function calculateOrderDemand(ctx: DemandContext, order: Order): OrderDemand {
  const invalidQuantityItemCodes: ItemCode[] = []
  const requested: DemandLine[] = []

  for (const item of order.items) {
    if (item.status !== '정상') continue
    if (item.quantity <= 0) {
      invalidQuantityItemCodes.push(item.itemCode)
      continue
    }
    requested.push({ itemCode: item.itemCode, quantity: item.quantity })
  }

  const expanded = expandBundleLines(ctx.items, ctx.bundleComponents, requested)

  return {
    lines: expanded.lines,
    unknownItemCodes: expanded.unknownItemCodes,
    excludedItemCodes: expanded.excludedItemCodes,
    invalidQuantityItemCodes,
  }
}

/** 여러 주문의 품목별 소요량 합계 — 부족분 산출의 입력이 된다 */
export function aggregateDemand(demands: readonly DemandLine[][]): DemandLine[] {
  const totals = new Map<ItemCode, number>()
  for (const lines of demands) {
    for (const line of lines) {
      totals.set(line.itemCode, (totals.get(line.itemCode) ?? 0) + line.quantity)
    }
  }
  return [...totals].map(([itemCode, quantity]) => ({ itemCode, quantity }))
}
