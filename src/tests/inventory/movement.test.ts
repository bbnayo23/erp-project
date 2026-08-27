import { beforeEach, describe, expect, it } from 'vitest'
import { useErpStore } from '@/store/erpStore'
import { findInventory } from '@/domain/inventory/getAvailableQuantity'
import { planPreparation } from '@/domain/preparation/planPreparation'
import { getRemainingQuantity } from '@/domain/purchase/getRemainingQuantity'

/**
 * 재고 변동 이력.
 *
 * 숫자가 맞는지는 다른 테스트가 본다. 여기서 보는 것은 '왜 바뀌었는가' 가 남는지다 —
 * 예약은 예약수량만, 출고는 둘 다, 입고는 현재고만 움직이므로 이력 없이는 화면의
 * 숫자에서 원인을 되짚을 수 없다.
 */
describe('재고 변동 이력', () => {
  const state = () => useErpStore.getState()
  const plan = () => planPreparation(state())

  /** 이 주문·품목·창고의 이력 */
  const movementsOf = (orderId: string) =>
    state().stockMovements.filter((movement) => movement.orderId === orderId)

  beforeEach(() => {
    state().reset()
  })

  const readyOrder = () => {
    const entry = plan().entries.find(
      (candidate) => candidate.preparation.status === 'READY' && !candidate.reserved,
    )
    if (!entry) throw new Error('시드에 바로 준비 가능한 주문이 없다')
    return entry
  }

  it('예약은 예약수량만 움직인 것으로 남는다', () => {
    const entry = readyOrder()

    expect(state().reserve(entry.order.orderId).ok).toBe(true)

    const movements = movementsOf(entry.order.orderId)
    expect(movements.length).toBe(entry.preparation.items.length)

    for (const movement of movements) {
      expect(movement.kind).toBe('RESERVE')
      // 예약은 창고에서 물건을 꺼내지 않는다 — 현재고는 그대로다
      expect(movement.currentDelta).toBe(0)
      expect(movement.reservedDelta).toBeGreaterThan(0)

      const inventory = findInventory(
        state().inventories,
        movement.itemCode,
        movement.warehouseCode,
      )
      // 변화 후 잔액이 실제 재고와 같아야 담당자가 이력으로 검산할 수 있다
      expect(movement.currentQuantity).toBe(inventory?.currentQuantity)
      expect(movement.reservedQuantity).toBe(inventory?.reservedQuantity)
    }
  })

  it('출고는 현재고와 예약수량을 함께 줄인 것으로 남는다', () => {
    const entry = readyOrder()

    state().reserve(entry.order.orderId)
    expect(state().ship(entry.order.orderId).ok).toBe(true)

    const shipped = movementsOf(entry.order.orderId).filter((movement) => movement.kind === 'SHIP')
    expect(shipped.length).toBeGreaterThan(0)

    for (const movement of shipped) {
      expect(movement.currentDelta).toBeLessThan(0)
      expect(movement.reservedDelta).toBeLessThan(0)
      // 출고는 예약을 소비한다 — 두 칸이 같은 양만큼 내려가야 한다
      expect(movement.currentDelta).toBe(movement.reservedDelta)
    }
  })

  it('입고는 현재고만 늘린 것으로 남고, 어느 문서인지 붙는다', () => {
    const document = state().incomingDocuments.find(
      (candidate) =>
        candidate.confirmed &&
        candidate.inspectionStatus !== '검사 대기' &&
        candidate.inspectionStatus !== '검사 전' &&
        getRemainingQuantity(candidate) > 0,
    )
    if (!document) throw new Error('시드에 바로 입고할 수 있는 문서가 없다')

    expect(state().receive(document.documentId, 1, 'TEST:RECEIVE:1').ok).toBe(true)

    const movement = state().stockMovements.find(
      (candidate) => candidate.documentId === document.documentId,
    )
    expect(movement?.kind).toBe('RECEIVE')
    expect(movement?.currentDelta).toBe(1)
    expect(movement?.reservedDelta).toBe(0)
  })

  it('같은 요청을 반복해도 이력이 두 줄 쌓이지 않는다', () => {
    const entry = readyOrder()

    state().reserve(entry.order.orderId)
    const once = state().stockMovements.length

    // 두 번째 예약은 DUPLICATE_REQUEST 로 막힌다 — 재고도 이력도 그대로여야 한다
    expect(state().reserve(entry.order.orderId).ok).toBe(false)
    expect(state().stockMovements.length).toBe(once)
  })

  it('움직이지 않은 품목은 이력에 남지 않는다', () => {
    const entry = readyOrder()
    const touched = new Set(entry.preparation.items.map((item) => item.itemCode))

    state().reserve(entry.order.orderId)

    // 원장 전체를 대입하지만 이력은 실제로 바뀐 칸만 남는다
    expect(state().stockMovements.every((movement) => touched.has(movement.itemCode))).toBe(true)
  })
})
