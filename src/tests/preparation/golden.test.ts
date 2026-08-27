import { describe, expect, it } from 'vitest'
import type { PreparationStatus, PreparationWaitingReason } from '@/types'
import { createInitialDatabase } from '@/store/erpStore'
import { planPreparation } from '@/domain/preparation/planPreparation'
import { isPreparationTarget } from '@/domain/preparation/preparationRules'

/**
 * 골든 파일 — 주문 29건의 기대 판정값.
 *
 * 명세(`60-test-scenarios.md`)의 표를 그대로 옮겼다. 시드 데이터에 업무 규칙을 손으로
 * 적용해 계산한 결과이므로, 이 표와 다르면 규칙 구현이 틀린 것이다.
 *
 * 개별 규칙 테스트(demand · status · priority …)는 손으로 세운 최소 데이터로 규칙 하나씩을
 * 확인한다. 이 파일은 반대로 **29건이 서로 물린 상태**를 본다 — 앞선 주문이 가져간 몫,
 * 접수시각 tie-break, 입고예정 선점이 모두 얽힌 결과는 그렇게만 드러난다.
 */
describe('골든 파일 — 주문 29건 판정', () => {
  const db = createInitialDatabase()
  const plan = planPreparation(db)

  interface Expected {
    priority: number
    orderId: string
    status: PreparationStatus
    /** WAITING 일 때 무엇을 기다리는가 */
    reason?: PreparationWaitingReason
    /** 부족수량 합계 */
    shortage?: number
  }

  /** 배송예정일 ASC, 주문접수일시 ASC 순서 그대로 */
  const EXPECTED: Expected[] = [
    { priority: 1, orderId: 'ORD202607200026', status: 'EXCEPTION' },
    { priority: 2, orderId: 'ORD202607200016', status: 'READY' },
    { priority: 3, orderId: 'ORD202607200017', status: 'READY' },
    { priority: 4, orderId: 'ORD202607200001', status: 'READY' },
    { priority: 5, orderId: 'ORD202607200006', status: 'READY' },
    { priority: 6, orderId: 'ORD202607200009', status: 'READY' },
    { priority: 7, orderId: 'ORD202607200018', status: 'READY' },
    { priority: 8, orderId: 'ORD202607200019', status: 'WAITING', reason: 'PURCHASE' },
    { priority: 9, orderId: 'ORD202607200002', status: 'READY' },
    { priority: 10, orderId: 'ORD202607200007', status: 'WAITING', reason: 'QUALITY_INSPECTION' },
    { priority: 11, orderId: 'ORD202607200012', status: 'SHORTAGE', shortage: 1 },
    { priority: 12, orderId: 'ORD202607200003', status: 'READY' },
    { priority: 13, orderId: 'ORD202607200010', status: 'EXCEPTION' },
    { priority: 14, orderId: 'ORD202607200011', status: 'EXCEPTION' },
    { priority: 15, orderId: 'ORD202607200020', status: 'SHORTAGE', shortage: 1 },
    { priority: 16, orderId: 'ORD202607200021', status: 'SHORTAGE', shortage: 1 },
    { priority: 17, orderId: 'ORD202607200005', status: 'WAITING', reason: 'PURCHASE' },
    { priority: 18, orderId: 'ORD202607200022', status: 'WAITING', reason: 'QUALITY_INSPECTION' },
    { priority: 19, orderId: 'ORD202607200023', status: 'READY' },
    { priority: 20, orderId: 'ORD202607200008', status: 'WAITING', reason: 'PRODUCTION' },
    { priority: 21, orderId: 'ORD202607200015', status: 'SHORTAGE', shortage: 1 },
    { priority: 22, orderId: 'ORD202607200024', status: 'SHORTAGE', shortage: 2 },
    { priority: 23, orderId: 'ORD202607200025', status: 'SHORTAGE', shortage: 1 },
    { priority: 24, orderId: 'ORD202607200027', status: 'READY' },
    { priority: 25, orderId: 'ORD202607210029', status: 'SHORTAGE', shortage: 1 },
    { priority: 26, orderId: 'ORD202607210028', status: 'READY' },
  ]

  /** 준비 대상에서 빠지는 주문과 그 이유 */
  const EXCLUDED = [
    { orderId: 'ORD202607180014', reason: '배송 완료' },
    { orderId: 'ORD202607190013', reason: '출고 완료' },
    { orderId: 'ORD202607190004', reason: '취소' },
  ]

  it('준비 대상은 26건이고 제외 3건은 계획에 오르지 않는다', () => {
    expect(plan.entries).toHaveLength(EXPECTED.length)

    for (const { orderId } of EXCLUDED) {
      const order = db.orders.find((candidate) => candidate.orderId === orderId)
      expect(order, `${orderId} 가 시드에 없다`).toBeDefined()
      expect(isPreparationTarget(order!)).toBe(false)
      expect(plan.entries.some((entry) => entry.order.orderId === orderId)).toBe(false)
    }
  })

  it('배정 순서가 명세와 같다', () => {
    expect(plan.entries.map((entry) => entry.order.orderId)).toEqual(
      EXPECTED.map((expected) => expected.orderId),
    )
  })

  it.each(EXPECTED)('#$priority $orderId → $status', (expected) => {
    const entry = plan.entries[expected.priority - 1]

    expect(entry?.order.orderId).toBe(expected.orderId)
    expect(entry?.preparation.status).toBe(expected.status)

    if (expected.reason) {
      const reasons = new Set(
        entry?.preparation.items
          .map((item) => item.waitingReason)
          .filter((reason): reason is PreparationWaitingReason => reason !== undefined),
      )
      expect([...reasons]).toContain(expected.reason)
    }

    if (expected.shortage !== undefined) {
      const shortage = (entry?.preparation.items ?? []).reduce(
        (total, item) => total + item.shortageQuantity,
        0,
      )
      expect(shortage).toBe(expected.shortage)
    }
  })

  /**
   * 명세의 집계표.
   *
   * 개별 건이 맞아도 합계를 따로 확인하는 이유: 한 건이 다른 상태로 넘어가면 두 칸이
   * 동시에 틀리는데, 개별 검증만 있으면 어느 쪽이 원인인지 표에서 바로 보이지 않는다.
   */
  it('상태별 집계가 명세와 같다', () => {
    const count = (status: PreparationStatus) =>
      plan.entries.filter((entry) => entry.preparation.status === status).length

    expect({
      READY: count('READY'),
      WAITING: count('WAITING'),
      SHORTAGE: count('SHORTAGE'),
      EXCEPTION: count('EXCEPTION'),
    }).toEqual({
      // 바로 준비 가능 11
      READY: 11,
      // 품질검사 대기 2 + 생산 완료 대기 1 + 구매 입고 대기 2
      WAITING: 5,
      // 재고 부족 7
      SHORTAGE: 7,
      // 확인 필요 3
      EXCEPTION: 3,
    })
  })
})

/**
 * 골든 파일 — 판정을 모두 마친 뒤 원장에 남은 양.
 *
 * 판정 결과가 맞아도 배정량이 틀릴 수 있다. 앞선 주문이 얼마를 가져갔는지는 상태값에
 * 드러나지 않기 때문이다 — 이 표가 그것을 고정한다.
 *
 * 특히 `WH-CJ PIL-ZERO` 는 초기 가용 4에서 아무것도 빠지지 않는다. 그 재고를 원하던
 * `ORD202607200021` 이 재고 부족 판정을 받아 **선점하지 않기** 때문이다.
 */
describe('골든 파일 — 배정 후 잔량', () => {
  const plan = planPreparation(createInitialDatabase())

  /** 부족 주문은 원장을 건드리지 않으므로 배정량에서 뺀다 */
  const allocated = new Map<string, number>()
  for (const entry of plan.entries) {
    if (entry.preparation.status === 'SHORTAGE') continue
    for (const item of entry.preparation.items) {
      const key = `${entry.order.warehouseCode}/${item.itemCode}`
      allocated.set(key, (allocated.get(key) ?? 0) + item.allocatedFromStock)
    }
  }

  /** 창고 / 품목 → 배정된 현재고 수량 */
  const EXPECTED_ALLOCATION: [string, number][] = [
    ['WH-HQ/MAT-Z10-Q', 2],
    ['WH-HQ/MAT-Z10-K', 2],
    ['WH-HQ/MAT-V3-Q', 1],
    ['WH-HQ/MAT-E5-SS', 0],
    ['WH-HQ/FRM-DMN-Q', 1],
    ['WH-HQ/FRM-DMN-K', 1],
    ['WH-HQ/FRM-LOW-Q', 0],
    ['WH-HQ/CVR-WP-Q', 3],
    ['WH-HQ/CVR-WP-K', 1],
    ['WH-HQ/TOP-LTX-Q', 2],
    ['WH-08/PIL-ZERO', 7],
    ['WH-08/PIL-CERV', 5],
    ['WH-08/CVR-WP-Q', 2],
    ['WH-08/TOP-LTX-Q', 1],
    ['WH-CJ/MAT-V3-Q', 1],
    ['WH-CJ/FRM-LOW-Q', 2],
    ['WH-CJ/CVR-WP-K', 2],
    // 부족 주문(ORD202607200021)이 선점하지 않아 그대로 남는다
    ['WH-CJ/PIL-ZERO', 0],
  ]

  it.each(EXPECTED_ALLOCATION)('%s 에서 %i개가 배정된다', (key, quantity) => {
    expect(allocated.get(key) ?? 0).toBe(quantity)
  })
})
