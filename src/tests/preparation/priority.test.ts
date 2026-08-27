import { describe, expect, it } from 'vitest'
import { evaluateOrder } from '@/domain/preparation/evaluateOrder'
import { planPreparation } from '@/domain/preparation/planPreparation'
import { sortOrdersByPriority } from '@/domain/preparation/sortOrdersByPriority'
import { BASE_AT, db, entryOf, incoming, inventory, lineOf, order } from '../fixtures'

/**
 * 배송일 우선순위와 순차 배정 (가이드 §6, §9)
 *
 * 이 프로젝트에서 가장 틀리기 쉬운 규칙이다. 주문을 하나씩 따로 판정하면 같은 재고를
 * 여러 주문이 각각 전부 쓸 수 있다고 보게 된다 — 화면에는 '바로 준비 가능' 이 세 건인데
 * 실제로는 한 건만 나가는 상태다. 앞선 주문이 배정한 몫은 뒤 주문이 쓸 수 없어야 한다.
 */
describe('배송일 우선순위', () => {
  describe('정렬', () => {
    it('배송예정일이 빠른 주문이 앞선다', () => {
      const sorted = sortOrdersByPriority([
        order({ id: 'ORD-LATE', deliveryDay: 27, items: [] }),
        order({ id: 'ORD-EARLY', deliveryDay: 22, items: [] }),
        order({ id: 'ORD-MID', deliveryDay: 25, items: [] }),
      ])

      expect(sorted.map((target) => target.orderId)).toEqual(['ORD-EARLY', 'ORD-MID', 'ORD-LATE'])
    })

    it('배송예정일이 같으면 주문접수일시가 빠른 주문이 앞선다', () => {
      const sorted = sortOrdersByPriority([
        order({ id: 'ORD-B', deliveryDay: 25, orderedAt: '2026-07-20T14:00:00+09:00', items: [] }),
        order({ id: 'ORD-A', deliveryDay: 25, orderedAt: '2026-07-19T09:00:00+09:00', items: [] }),
      ])

      expect(sorted.map((target) => target.orderId)).toEqual(['ORD-A', 'ORD-B'])
    })

    it('입력 배열을 흐트러뜨리지 않는다', () => {
      const orders = [
        order({ id: 'ORD-LATE', deliveryDay: 27, items: [] }),
        order({ id: 'ORD-EARLY', deliveryDay: 22, items: [] }),
      ]
      sortOrdersByPriority(orders)

      expect(orders.map((target) => target.orderId)).toEqual(['ORD-LATE', 'ORD-EARLY'])
    })
  })

  describe('현재고 순차 배정', () => {
    const twoOrdersOnOneUnit = db({
      inventories: [inventory('PIL-STD', 1)],
      orders: [
        order({ id: 'ORD-LATE', deliveryDay: 27, items: [{ itemCode: 'PIL-STD', quantity: 1 }] }),
        order({ id: 'ORD-EARLY', deliveryDay: 22, items: [{ itemCode: 'PIL-STD', quantity: 1 }] }),
      ],
    })

    it('가용재고 1개를 두 주문이 원하면 배송일이 빠른 쪽만 READY 다', () => {
      const plan = planPreparation(twoOrdersOnOneUnit)

      expect(entryOf(plan, 'ORD-EARLY').preparation.status).toBe('READY')
      expect(entryOf(plan, 'ORD-LATE').preparation.status).toBe('SHORTAGE')
    })

    /**
     * 대조. 같은 데이터를 주문별로 따로 판정하면 둘 다 READY 가 된다 —
     * 목록 화면이 planPreparation 을 거쳐야 하는 이유다.
     */
    it('주문을 따로 판정하면 둘 다 READY 로 보인다', () => {
      for (const target of twoOrdersOnOneUnit.orders) {
        expect(evaluateOrder(twoOrdersOnOneUnit, target).status).toBe('READY')
      }
    })

    it('뒤 주문에는 앞 주문이 가져간 뒤의 잔량만 보인다', () => {
      const plan = planPreparation(twoOrdersOnOneUnit)

      expect(lineOf(entryOf(plan, 'ORD-EARLY').preparation, 'PIL-STD').availableQuantity).toBe(1)
      expect(lineOf(entryOf(plan, 'ORD-LATE').preparation, 'PIL-STD').availableQuantity).toBe(0)
    })

    it('우선순위는 1부터 배송일 순으로 매겨진다', () => {
      const plan = planPreparation(twoOrdersOnOneUnit)

      expect(plan.entries.map((entry) => [entry.priority, entry.order.orderId])).toEqual([
        [1, 'ORD-EARLY'],
        [2, 'ORD-LATE'],
      ])
    })

    it('배정은 원본 재고를 바꾸지 않는다', () => {
      planPreparation(twoOrdersOnOneUnit)

      expect(twoOrdersOnOneUnit.inventories[0]?.currentQuantity).toBe(1)
      expect(twoOrdersOnOneUnit.inventories[0]?.reservedQuantity).toBe(0)
    })

    it('한 주문이 여러 개를 가져가면 남은 만큼만 다음 주문에 간다', () => {
      const plan = planPreparation(
        db({
          inventories: [inventory('PIL-STD', 5)],
          orders: [
            order({ id: 'ORD-1', deliveryDay: 22, items: [{ itemCode: 'PIL-STD', quantity: 4 }] }),
            order({ id: 'ORD-2', deliveryDay: 23, items: [{ itemCode: 'PIL-STD', quantity: 1 }] }),
            order({ id: 'ORD-3', deliveryDay: 24, items: [{ itemCode: 'PIL-STD', quantity: 1 }] }),
          ],
        }),
      )

      expect(entryOf(plan, 'ORD-1').preparation.status).toBe('READY')
      expect(entryOf(plan, 'ORD-2').preparation.status).toBe('READY')
      expect(entryOf(plan, 'ORD-3').preparation.status).toBe('SHORTAGE')
    })
  })

  describe('입고예정 순차 배정', () => {
    it('앞 주문이 입고예정을 가져가면 뒤 주문은 쓸 수 없다', () => {
      const plan = planPreparation(
        db({
          incomingDocuments: [
            incoming({ id: 'PO-1', itemCode: 'PIL-STD', plannedQuantity: 1, availableDay: 23 }),
          ],
          orders: [
            order({
              id: 'ORD-EARLY',
              deliveryDay: 25,
              items: [{ itemCode: 'PIL-STD', quantity: 1 }],
            }),
            order({
              id: 'ORD-LATE',
              deliveryDay: 26,
              items: [{ itemCode: 'PIL-STD', quantity: 1 }],
            }),
          ],
        }),
      )

      expect(entryOf(plan, 'ORD-EARLY').preparation.status).toBe('WAITING')
      expect(entryOf(plan, 'ORD-LATE').preparation.status).toBe('SHORTAGE')
    })

    /**
     * 입고예정을 합계 하나로 들고 있으면 이 구분이 사라진다. 배송일이 늦은 주문은
     * 앞 주문이 쓸 수 없었던 늦게 오는 물량을 쓸 수 있다.
     */
    it('앞 주문이 못 쓴 늦게 오는 물량은 뒤 주문이 쓸 수 있다', () => {
      const plan = planPreparation(
        db({
          incomingDocuments: [
            incoming({ id: 'PO-LATE', itemCode: 'PIL-STD', plannedQuantity: 5, availableDay: 26 }),
          ],
          orders: [
            order({
              id: 'ORD-EARLY',
              deliveryDay: 25,
              items: [{ itemCode: 'PIL-STD', quantity: 1 }],
            }),
            order({
              id: 'ORD-LATE',
              deliveryDay: 28,
              items: [{ itemCode: 'PIL-STD', quantity: 1 }],
            }),
          ],
        }),
      )

      expect(entryOf(plan, 'ORD-EARLY').preparation.status).toBe('SHORTAGE')
      expect(entryOf(plan, 'ORD-LATE').preparation.status).toBe('WAITING')
    })

    it('가용재고를 먼저 쓰고 모자란 만큼만 입고예정에서 당긴다', () => {
      const plan = planPreparation(
        db({
          inventories: [inventory('PIL-STD', 3)],
          incomingDocuments: [
            incoming({ id: 'PO-1', itemCode: 'PIL-STD', plannedQuantity: 10, availableDay: 23 }),
          ],
          orders: [
            order({ id: 'ORD-1', deliveryDay: 25, items: [{ itemCode: 'PIL-STD', quantity: 5 }] }),
          ],
        }),
      )

      const line = lineOf(entryOf(plan, 'ORD-1').preparation, 'PIL-STD')

      expect(line.allocatedFromStock).toBe(3)
      expect(line.allocatedFromIncoming).toBe(2)
    })
  })

  /**
   * 예약을 마친 주문은 배정 경쟁에서 빠진다.
   *
   * 예약수량은 이미 04_재고현황에 올라가 다른 주문의 가용재고에서 빠져 있다. 그 주문을
   * 다시 원장에 넣으면 자기 예약 때문에 자기가 부족해진다 — 현재고 5 중 3을 예약하면
   * 가용은 2 인데 소요는 여전히 3 이라 SHORTAGE 가 되고 있는 재고를 두고 발주가 나간다.
   */
  describe('예약된 주문', () => {
    const reservedPlan = () =>
      planPreparation(
        db({
          // 현재고 5 중 3이 이미 예약된 상태
          inventories: [inventory('PIL-STD', 5, 3)],
          orders: [
            order({
              id: 'ORD-RESERVED',
              deliveryDay: 22,
              items: [{ itemCode: 'PIL-STD', quantity: 3 }],
            }),
            order({
              id: 'ORD-NEXT',
              deliveryDay: 26,
              items: [{ itemCode: 'PIL-STD', quantity: 2 }],
            }),
          ],
          reservations: [
            {
              orderId: 'ORD-RESERVED',
              warehouseCode: 'WH-01',
              lines: [{ itemCode: 'PIL-STD', quantity: 3, serialNumbers: [] }],
              reservedAt: BASE_AT,
            },
          ],
        }),
      )

    it('자기 예약 때문에 부족해지지 않는다', () => {
      const entry = entryOf(reservedPlan(), 'ORD-RESERVED')

      expect(entry.reserved).toBe(true)
      expect(entry.preparation.status).toBe('READY')
      expect(lineOf(entry.preparation, 'PIL-STD').shortageQuantity).toBe(0)
    })

    it('예약분을 뺀 나머지만 다음 주문에 간다', () => {
      const entry = entryOf(reservedPlan(), 'ORD-NEXT')

      // 가용재고 = 5 - 3 = 2. 소요 2 니까 딱 맞는다.
      expect(lineOf(entry.preparation, 'PIL-STD').availableQuantity).toBe(2)
      expect(entry.preparation.status).toBe('READY')
      expect(entry.reserved).toBe(false)
    })
  })

  /**
   * 재고 부족 주문은 재고를 선점하지 않는다 (명세 20-domain-logic L3).
   *
   * "일부 품목만 가능하다면 그 주문의 일부 수량을 먼저 잡아두지 않습니다" 는 예약뿐
   * 아니라 판정에도 적용된다. 부족한 주문이 절반을 붙잡으면, 그 재고로 **전량 준비할 수
   * 있었던** 뒤 주문까지 함께 막힌다 — 나가지도 못할 주문이 나갈 수 있는 주문을 막는다.
   *
   * 대가는 배송일이 늦은 주문이 먼저 가져간다는 것이다. 의도된 맞바꿈이다.
   */
  it('재고 부족 주문은 잡을 뻔한 몫을 뒤 주문에 남긴다', () => {
    const plan = planPreparation(
      db({
        inventories: [inventory('PIL-STD', 2)],
        orders: [
          order({
            id: 'ORD-SHORT',
            deliveryDay: 22,
            items: [{ itemCode: 'PIL-STD', quantity: 5 }],
          }),
          order({ id: 'ORD-NEXT', deliveryDay: 26, items: [{ itemCode: 'PIL-STD', quantity: 2 }] }),
        ],
      }),
    )

    const short = lineOf(entryOf(plan, 'ORD-SHORT').preparation, 'PIL-STD')

    // 판정 자체는 있는 재고를 본다 — 부족수량은 2를 뺀 3이다
    expect(short.allocatedFromStock).toBe(2)
    expect(short.shortageQuantity).toBe(3)
    expect(entryOf(plan, 'ORD-SHORT').preparation.status).toBe('SHORTAGE')

    // 그러나 원장에서 덜어내지 않았으므로 뒤 주문은 2개를 전량 쓸 수 있다
    const next = entryOf(plan, 'ORD-NEXT')
    expect(next.preparation.status).toBe('READY')
    expect(lineOf(next.preparation, 'PIL-STD').allocatedFromStock).toBe(2)
  })

  /** 부족하지 않은 주문은 그대로 선점한다 — 위 규칙이 전체를 풀어놓는 것은 아니다 */
  it('전량 준비되는 주문은 자기 몫을 확실히 잡는다', () => {
    const plan = planPreparation(
      db({
        inventories: [inventory('PIL-STD', 2)],
        orders: [
          order({
            id: 'ORD-FIRST',
            deliveryDay: 22,
            items: [{ itemCode: 'PIL-STD', quantity: 2 }],
          }),
          order({
            id: 'ORD-LATER',
            deliveryDay: 26,
            items: [{ itemCode: 'PIL-STD', quantity: 1 }],
          }),
        ],
      }),
    )

    expect(entryOf(plan, 'ORD-FIRST').preparation.status).toBe('READY')
    expect(entryOf(plan, 'ORD-LATER').preparation.status).toBe('SHORTAGE')
  })
})
