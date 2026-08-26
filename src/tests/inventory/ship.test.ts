import { describe, expect, it } from 'vitest'
import type { ErpDatabase } from '@/types'
import { evaluateOrder } from '@/domain/preparation/evaluateOrder'
import { reserveOrder } from '@/domain/inventory/reserveOrder'
import { shipOrder } from '@/domain/inventory/shipOrder'
import { BASE_AT, commit, db, inventory, inventoryOf, order, serial } from '../fixtures'

/**
 * Case 6. 중복 출고 / 출고 시 재고 정합성 (가이드 §13, §20, §25, §28)
 *
 * 예약·피킹은 현재고를 건드리지 않는다. 물건은 아직 창고에 있다.
 * 현재고가 줄어드는 것은 출고 한 곳뿐이고, 이때 예약수량도 같이 줄어야 한다.
 */
describe('출고', () => {
  const target = order({ id: 'ORD-001', items: [{ itemCode: 'FRM-Q', quantity: 2 }] })

  /** 예약까지 끝난 상태 — 현재고 10, 예약 2, 개체 2건 배정 */
  const reserved = (): ErpDatabase => {
    const base = db({
      inventories: [inventory('FRM-Q', 10)],
      serials: [
        serial('FRM-0001', 'FRM-Q'),
        serial('FRM-0002', 'FRM-Q'),
        serial('FRM-0003', 'FRM-Q'),
      ],
      orders: [target],
    })

    const result = reserveOrder(base, {
      order: target,
      preparation: evaluateOrder(base, target),
      requestId: 'REQ-001',
      reservedAt: BASE_AT,
    })

    return commit(base, {
      inventories: result.inventories,
      serials: result.serials,
      reservations: result.reservations,
      processedRequests: result.processedRequests,
    })
  }

  const ship = (state: ErpDatabase, requestId = 'SHIP-001') =>
    shipOrder(state, { order: target, requestId, shippedAt: BASE_AT })

  describe('재고 정합성', () => {
    it('예약과 피킹만으로는 현재고가 줄지 않는다', () => {
      const state = reserved()

      expect(inventoryOf(state.inventories, 'FRM-Q').currentQuantity).toBe(10)
      expect(inventoryOf(state.inventories, 'FRM-Q').reservedQuantity).toBe(2)
    })

    it('출고하면 현재고와 예약수량이 함께 줄어든다', () => {
      const result = ship(reserved())

      expect(inventoryOf(result.inventories, 'FRM-Q').currentQuantity).toBe(8)
      expect(inventoryOf(result.inventories, 'FRM-Q').reservedQuantity).toBe(0)
    })

    it('내보낸 개체는 출고 완료가 되고 창고에 남은 개체는 그대로다', () => {
      const result = ship(reserved())

      expect(result.serials.filter((item) => item.status === '출고 완료')).toHaveLength(2)
      expect(result.serials.filter((item) => item.status === '창고 보관 중')).toHaveLength(1)
    })

    it('예약 기록은 소비되고 주문상태가 출고 완료로 바뀐다', () => {
      const result = ship(reserved())

      expect(result.reservations).toHaveLength(0)
      expect(result.orders[0]?.status).toBe('출고 완료')
    })
  })

  /** 예약은 출고와 함께 사라진다. 무엇을 어느 개체로 내보냈는지는 이 이력에만 남는다. */
  describe('출고 이력', () => {
    it('무엇을 몇 개, 어느 개체로 내보냈는지 남는다', () => {
      const result = ship(reserved())

      expect(result.shipments).toHaveLength(1)
      expect(result.shipment?.lines).toEqual([
        { itemCode: 'FRM-Q', quantity: 2, serialNumbers: ['FRM-0001', 'FRM-0002'] },
      ])
    })

    it('요청 ID 가 이력의 키가 된다', () => {
      const result = ship(reserved(), 'SHIP-042')

      expect(result.shipment?.shipmentId).toBe('SHIP-042')
    })
  })

  /** Case 6. 두 번 눌러도 현재고는 한 번만 줄고 이력도 하나만 생긴다. */
  describe('중복 출고', () => {
    const afterShip = (requestId = 'SHIP-001'): ErpDatabase => {
      const state = reserved()
      const result = ship(state, requestId)

      return commit(state, {
        inventories: result.inventories,
        serials: result.serials,
        reservations: result.reservations,
        orders: result.orders,
        shipments: result.shipments,
        processedRequests: result.processedRequests,
      })
    }

    it('같은 요청 ID 로 다시 출고하면 아무것도 바뀌지 않는다', () => {
      const state = afterShip()
      const second = ship(state, 'SHIP-001')

      expect(second.failure).toBe('DUPLICATE_REQUEST')
      expect(inventoryOf(second.inventories, 'FRM-Q').currentQuantity).toBe(8)
      expect(second.shipments).toHaveLength(1)
    })

    /**
     * 요청 ID 가 달라도 두 번째 출고는 막힌다. 예약을 소비하면서 처리하기 때문이다.
     *
     * 화면이 들고 있는 주문 객체가 낡아 아직 '주문 확정' 으로 보이는 상황을 그대로
     * 재현한다 — 요청 ID 도 새것, 주문상태도 낡은 것이라 두 방어선이 모두 뚫린
     * 최악의 경우다. 그래도 예약이 없어 재고는 지켜진다.
     */
    it('요청 ID 와 주문상태가 모두 낡아도 예약이 없으면 출고되지 않는다', () => {
      const state = afterShip()
      const second = ship(state, 'SHIP-002')

      expect(second.failure).toBe('NOT_RESERVED')
      expect(inventoryOf(second.inventories, 'FRM-Q').currentQuantity).toBe(8)
      expect(second.shipments).toHaveLength(1)
    })

    it('출고 완료된 주문은 주문상태만으로도 걸러진다', () => {
      const state = afterShip()
      const shipped = state.orders[0]
      if (!shipped) throw new Error('주문이 없다')

      const second = shipOrder(state, {
        order: shipped,
        requestId: 'SHIP-002',
        shippedAt: BASE_AT,
      })

      expect(second.failure).toBe('ALREADY_SHIPPED')
      expect(second.shipments).toHaveLength(1)
    })
  })

  it('예약 없이 출고할 수 없다', () => {
    const base = db({ inventories: [inventory('FRM-Q', 10)], orders: [target] })
    const result = ship(base)

    expect(result.failure).toBe('NOT_RESERVED')
    expect(inventoryOf(result.inventories, 'FRM-Q').currentQuantity).toBe(10)
    expect(result.shipments).toHaveLength(0)
  })
})
