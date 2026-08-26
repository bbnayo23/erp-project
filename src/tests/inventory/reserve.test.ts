import { describe, expect, it } from 'vitest'
import type { ErpDatabase, Order } from '@/types'
import { evaluateOrder } from '@/domain/preparation/evaluateOrder'
import { reserveOrder } from '@/domain/inventory/reserveOrder'
import { BASE_AT, commit, db, inventory, inventoryOf, order, serial } from '../fixtures'

/**
 * Case 4. 다품목 주문 All-or-Nothing / Case 6. 중복 예약 (가이드 §9.2, §11, §20, §28)
 */
describe('예약', () => {
  const reserve = (base: ErpDatabase, target: Order, requestId = 'REQ-001') =>
    reserveOrder(base, {
      order: target,
      preparation: evaluateOrder(base, target),
      requestId,
      reservedAt: BASE_AT,
    })

  describe('재고 정합성', () => {
    const base = db({
      inventories: [inventory('PIL-STD', 10)],
      orders: [order({ id: 'ORD-001', items: [{ itemCode: 'PIL-STD', quantity: 3 }] })],
    })
    const target = order({ id: 'ORD-001', items: [{ itemCode: 'PIL-STD', quantity: 3 }] })

    it('예약수량만 늘고 현재고는 그대로다', () => {
      const result = reserve(base, target)

      expect(result.ok).toBe(true)
      expect(inventoryOf(result.inventories, 'PIL-STD').currentQuantity).toBe(10)
      expect(inventoryOf(result.inventories, 'PIL-STD').reservedQuantity).toBe(3)
    })

    it('예약 기록이 주문별로 남는다', () => {
      const result = reserve(base, target)

      expect(result.reservations).toHaveLength(1)
      expect(result.reservation?.orderId).toBe('ORD-001')
      expect(result.reservation?.lines).toEqual([
        { itemCode: 'PIL-STD', quantity: 3, serialNumbers: [] },
      ])
    })

    it('예약 후 가용재고가 줄어 다른 주문이 쓸 수 없다', () => {
      const after = commit(base, { inventories: reserve(base, target).inventories })
      const nextOrder = order({ id: 'ORD-002', items: [{ itemCode: 'PIL-STD', quantity: 8 }] })

      expect(evaluateOrder(after, nextOrder).status).toBe('SHORTAGE')
    })
  })

  /**
   * Case 4. 한 품목이라도 부족하면 주문 전체를 예약하지 않는다.
   * 부분 예약은 준비되지 않은 주문이 재고를 붙들게 만들고, 그 재고는 나갈 수 있는
   * 다른 주문이 쓸 수 없다.
   */
  describe('전량 아니면 전무', () => {
    const base = db({
      inventories: [inventory('MAT-Q', 5), inventory('FRM-Q', 5), inventory('PIL-STD', 0)],
      serials: [serial('MAT-0001', 'MAT-Q'), serial('FRM-0001', 'FRM-Q')],
    })
    const target = order({ id: 'ORD-001', items: [{ itemCode: 'SET-001', quantity: 1 }] })

    it('세 품목 중 하나가 부족하면 예약이 거부된다', () => {
      const preparation = evaluateOrder(base, target)
      const result = reserve(base, target)

      expect(preparation.status).toBe('SHORTAGE')
      expect(result.ok).toBe(false)
      expect(result.failure).toBe('NOT_READY')
    })

    it('가능한 품목도 예약되지 않는다', () => {
      const result = reserve(base, target)

      expect(result.reservations).toHaveLength(0)
      expect(inventoryOf(result.inventories, 'MAT-Q').reservedQuantity).toBe(0)
      expect(inventoryOf(result.inventories, 'FRM-Q').reservedQuantity).toBe(0)
    })

    it('실패하면 입력을 그대로 돌려준다', () => {
      const result = reserve(base, target)

      expect(result.inventories).toBe(base.inventories)
      expect(result.serials).toBe(base.serials)
      expect(result.processedRequests).toBe(base.processedRequests)
    })
  })

  describe('시리얼 피킹', () => {
    const base = db({
      inventories: [inventory('FRM-Q', 3)],
      serials: [
        serial('FRM-0003', 'FRM-Q', { receivedAt: '2026-07-03T09:00:00+09:00' }),
        serial('FRM-0001', 'FRM-Q', { receivedAt: '2026-07-01T09:00:00+09:00' }),
        serial('FRM-0002', 'FRM-Q', { receivedAt: '2026-07-02T09:00:00+09:00' }),
      ],
    })
    const target = order({ id: 'ORD-001', items: [{ itemCode: 'FRM-Q', quantity: 2 }] })

    it('먼저 입고된 개체부터 배정한다', () => {
      const result = reserve(base, target)

      expect(result.reservation?.lines[0]?.serialNumbers).toEqual(['FRM-0001', 'FRM-0002'])
    })

    it('배정된 개체는 주문 배정됨 상태가 된다', () => {
      const result = reserve(base, target)
      const assigned = result.serials.filter((item) => item.status === '주문 배정됨')

      expect(assigned.map((item) => item.serialNumber)).toEqual(['FRM-0001', 'FRM-0002'])
      expect(assigned.every((item) => item.reservedOrderId === 'ORD-001')).toBe(true)
    })

    it('이미 다른 주문에 배정된 개체는 고르지 않는다', () => {
      const contended = db({
        inventories: [inventory('FRM-Q', 2)],
        serials: [
          serial('FRM-0001', 'FRM-Q', { status: '주문 배정됨', reservedOrderId: 'ORD-OTHER' }),
          serial('FRM-0002', 'FRM-Q'),
        ],
      })

      const result = reserve(
        contended,
        order({ id: 'ORD-001', items: [{ itemCode: 'FRM-Q', quantity: 1 }] }),
      )

      expect(result.reservation?.lines[0]?.serialNumbers).toEqual(['FRM-0002'])
    })

    /** 수량은 맞는데 개체가 없으면 04_재고현황과 05_개체재고가 어긋난 것이다 */
    it('배정할 개체가 모자라면 절반만 반영하지 않는다', () => {
      const inconsistent = db({
        inventories: [inventory('FRM-Q', 3)],
        serials: [serial('FRM-0001', 'FRM-Q')],
      })

      const result = reserve(
        inconsistent,
        order({ id: 'ORD-001', items: [{ itemCode: 'FRM-Q', quantity: 3 }] }),
      )

      expect(result.failure).toBe('SERIAL_SHORTAGE')
      expect(result.serials).toBe(inconsistent.serials)
      expect(result.reservations).toHaveLength(0)
    })
  })

  /**
   * Case 6. 같은 요청이 반복되어도 예약수량은 한 번만 늘어난다.
   * 근거가 두 겹인 이유: 요청 ID 는 같은 버튼을 두 번 누른 경우를, Reservation 기록은
   * 다른 경로로 이미 예약된 주문을 막는다.
   */
  describe('중복 요청', () => {
    const base = db({ inventories: [inventory('PIL-STD', 10)] })
    const target = order({ id: 'ORD-001', items: [{ itemCode: 'PIL-STD', quantity: 2 }] })

    const afterFirst = () => {
      const first = reserve(base, target, 'REQ-001')
      return commit(base, {
        inventories: first.inventories,
        serials: first.serials,
        reservations: first.reservations,
        processedRequests: first.processedRequests,
      })
    }

    it('같은 요청 ID 로 다시 요청하면 아무것도 바뀌지 않는다', () => {
      const state = afterFirst()
      const second = reserve(state, target, 'REQ-001')

      expect(second.failure).toBe('DUPLICATE_REQUEST')
      expect(inventoryOf(second.inventories, 'PIL-STD').reservedQuantity).toBe(2)
      expect(second.reservations).toHaveLength(1)
    })

    it('요청 ID 가 달라도 이미 예약된 주문은 다시 예약하지 않는다', () => {
      const state = afterFirst()
      const second = reserve(state, target, 'REQ-002')

      expect(second.failure).toBe('ALREADY_RESERVED')
      expect(inventoryOf(second.inventories, 'PIL-STD').reservedQuantity).toBe(2)
      expect(second.reservations).toHaveLength(1)
    })

    it('처리한 요청은 이력에 남는다', () => {
      const first = reserve(base, target, 'REQ-001')

      expect(first.processedRequests).toEqual([
        { requestId: 'REQ-001', kind: 'RESERVE', processedAt: BASE_AT },
      ])
    })
  })
})
