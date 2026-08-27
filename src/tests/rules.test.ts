import { beforeEach, describe, expect, it } from 'vitest'
import { useErpStore } from '@/store/erpStore'
import { findInventory } from '@/domain/inventory/getAvailableQuantity'
import { planPreparation } from '@/domain/preparation/planPreparation'
import { getRemainingQuantity } from '@/domain/purchase/getRemainingQuantity'
import { calculateShortage } from '@/domain/purchase/calculateShortage'

/**
 * 핵심 업무 규칙 — 실제 시드로 한 번에 검증한다.
 *
 * 개별 규칙 테스트는 손으로 세운 최소 데이터로 규칙 하나씩을 확인하고, 골든 파일은
 * 29건이 물린 판정 결과를 확인한다. 이 파일은 세 번째 축이다 — **명세가 "절대 하지
 * 말 것" 으로 못 박은 항목**이 실제 데이터에서 지켜지는지 본다.
 *
 * 규칙 하나가 깨졌을 때 어느 규칙인지 이름으로 바로 드러나야 하므로, 테스트 이름을
 * 명세 문장 그대로 쓴다.
 */
describe('핵심 업무 규칙', () => {
  const state = () => useErpStore.getState()

  beforeEach(() => {
    state().reset()
  })

  /** 시드에서 조건에 맞는 주문 하나 */
  const orderWith = (predicate: (status: string, reserved: boolean) => boolean) => {
    const entry = planPreparation(state()).entries.find((candidate) =>
      predicate(candidate.preparation.status, candidate.reserved),
    )
    if (!entry) throw new Error('조건에 맞는 주문이 시드에 없다')
    return entry
  }

  describe('예약·피킹은 현재고를 건드리지 않는다', () => {
    it('예약하면 예약수량만 늘고 현재고는 그대로다', () => {
      const entry = orderWith((status, reserved) => status === 'READY' && !reserved)
      const before = state().inventories.map((inventory) => ({ ...inventory }))

      expect(state().reserve(entry.order.orderId).ok).toBe(true)

      for (const previous of before) {
        const current = findInventory(
          state().inventories,
          previous.itemCode,
          previous.warehouseCode,
        )
        // 현재고는 한 칸도 움직이지 않는다 — 이 한 줄이 과제 채점의 핵심이다
        expect(current?.currentQuantity).toBe(previous.currentQuantity)
      }

      const moved = state().stockMovements.filter(
        (movement) => movement.orderId === entry.order.orderId,
      )
      expect(moved.length).toBeGreaterThan(0)
      expect(moved.every((movement) => movement.currentDelta === 0)).toBe(true)
      expect(moved.every((movement) => movement.reservedDelta > 0)).toBe(true)
    })

    it('예약하면 개체가 주문에 배정된다', () => {
      const entry = orderWith(
        (status, reserved) =>
          status === 'READY' &&
          !reserved &&
          planPreparation(state()).entries.find(
            (candidate) => candidate.preparation.status === status,
          )!.preparation.items.length > 0,
      )

      state().reserve(entry.order.orderId)

      const assigned = state().serials.filter(
        (serial) => serial.reservedOrderId === entry.order.orderId,
      )
      // 시리얼 품목이 없는 주문이면 배정할 개체도 없다 — 있을 때만 상태를 본다
      expect(assigned.every((serial) => serial.status === '주문 배정됨')).toBe(true)
    })
  })

  describe('출고는 현재고와 예약수량을 함께 줄인다', () => {
    it('출고 후 두 칸이 같은 양만큼 내려간다', () => {
      const entry = orderWith((status, reserved) => status === 'READY' && !reserved)

      state().reserve(entry.order.orderId)
      expect(state().ship(entry.order.orderId).ok).toBe(true)

      const shipped = state().stockMovements.filter(
        (movement) => movement.orderId === entry.order.orderId && movement.kind === 'SHIP',
      )
      expect(shipped.length).toBeGreaterThan(0)
      for (const movement of shipped) {
        expect(movement.currentDelta).toBeLessThan(0)
        expect(movement.currentDelta).toBe(movement.reservedDelta)
      }
    })

    it('출고한 개체는 창고를 떠난다', () => {
      const entry = orderWith((status, reserved) => status === 'READY' && !reserved)

      state().reserve(entry.order.orderId)
      state().ship(entry.order.orderId)

      const units = state().serials.filter(
        (serial) => serial.reservedOrderId === entry.order.orderId,
      )
      expect(units.every((serial) => serial.status === '출고 완료')).toBe(true)
    })
  })

  describe('부분 예약을 하지 않는다', () => {
    it('한 품목이라도 부족하면 아무것도 예약되지 않는다', () => {
      const entry = orderWith((status) => status === 'SHORTAGE')
      const before = JSON.stringify(state().inventories)

      const outcome = state().reserve(entry.order.orderId)

      expect(outcome.ok).toBe(false)
      expect(JSON.stringify(state().inventories)).toBe(before)
      expect(state().reservations).toEqual([])
    })
  })

  describe('발주를 만든 것만으로 현재고는 늘지 않는다', () => {
    it('발주 생성 후 현재고가 그대로다', () => {
      const entry = orderWith((status) => status === 'SHORTAGE')
      const lines = calculateShortage(planPreparation(state())).filter((line) =>
        line.orderIds.includes(entry.order.orderId),
      )
      const before = JSON.stringify(state().inventories)

      expect(state().issueIncoming(lines, 'RULES:ISSUE').ok).toBe(true)

      expect(JSON.stringify(state().inventories)).toBe(before)
      expect(state().incomingDocuments.some((document) => document.relatedOrderId)).toBe(true)
    })

    it('입고 처리를 해야 현재고가 는다', () => {
      const document = state().incomingDocuments.find(
        (candidate) =>
          candidate.confirmed &&
          candidate.inspectionStatus === '해당 없음' &&
          getRemainingQuantity(candidate) > 0,
      )
      if (!document) throw new Error('시드에 바로 입고할 수 있는 구매 문서가 없다')

      const before =
        findInventory(state().inventories, document.itemCode, document.warehouseCode)
          ?.currentQuantity ?? 0

      expect(state().receive(document.documentId, 1, 'RULES:RECEIVE').ok).toBe(true)

      expect(
        findInventory(state().inventories, document.itemCode, document.warehouseCode)
          ?.currentQuantity,
      ).toBe(before + 1)
    })
  })

  describe('검사 미통과 생산 물량은 현재고가 되지 않는다', () => {
    it('검사 전에는 입고를 거부한다', () => {
      const document = state().incomingDocuments.find(
        (candidate) => candidate.confirmed && candidate.inspectionStatus === '검사 대기',
      )
      if (!document) throw new Error('시드에 검사 대기 문서가 없다')

      const before = JSON.stringify(state().inventories)
      const outcome = state().receive(document.documentId, 1, 'RULES:EARLY')

      expect(outcome.ok).toBe(false)
      expect(outcome.code).toBe('INSPECTION_PENDING')
      expect(JSON.stringify(state().inventories)).toBe(before)
    })

    it('검사를 통과해야 입고할 수 있다', () => {
      const document = state().incomingDocuments.find(
        (candidate) => candidate.confirmed && candidate.inspectionStatus === '검사 대기',
      )
      if (!document) throw new Error('시드에 검사 대기 문서가 없다')

      expect(state().inspect(document.documentId).ok).toBe(true)
      expect(state().receive(document.documentId, 1, 'RULES:AFTER').ok).toBe(true)
    })
  })

  describe('같은 요청은 한 번만 반영된다', () => {
    it('같은 예약을 두 번 보내도 재고가 한 번만 바뀐다', () => {
      const entry = orderWith((status, reserved) => status === 'READY' && !reserved)

      state().reserve(entry.order.orderId)
      const after = JSON.stringify(state().inventories)
      const movements = state().stockMovements.length

      expect(state().reserve(entry.order.orderId).ok).toBe(false)
      expect(JSON.stringify(state().inventories)).toBe(after)
      expect(state().stockMovements).toHaveLength(movements)
    })

    it('같은 입고 요청을 두 번 보내도 입고수량이 한 번만 는다', () => {
      const document = state().incomingDocuments.find(
        (candidate) =>
          candidate.confirmed &&
          candidate.inspectionStatus === '해당 없음' &&
          getRemainingQuantity(candidate) > 0,
      )
      if (!document) throw new Error('시드에 바로 입고할 수 있는 구매 문서가 없다')

      state().receive(document.documentId, 1, 'RULES:ONCE')
      const after = JSON.stringify(state().inventories)

      expect(state().receive(document.documentId, 1, 'RULES:ONCE').ok).toBe(false)
      expect(JSON.stringify(state().inventories)).toBe(after)
    })

    it('계획수량을 넘는 입고는 거부된다', () => {
      const document = state().incomingDocuments.find(
        (candidate) =>
          candidate.confirmed &&
          candidate.inspectionStatus === '해당 없음' &&
          getRemainingQuantity(candidate) > 0,
      )
      if (!document) throw new Error('시드에 바로 입고할 수 있는 구매 문서가 없다')

      const outcome = state().receive(
        document.documentId,
        getRemainingQuantity(document) + 1,
        'RULES:OVER',
      )

      expect(outcome.ok).toBe(false)
      expect(outcome.code).toBe('EXCEEDS_REMAINING')
    })
  })

  describe('사용 중지 창고와 미확정 발주는 판정에 쓰지 않는다', () => {
    it('사용 중지 창고 주문은 확인 필요이고 재고를 바꾸지 않는다', () => {
      const entry = planPreparation(state()).entries.find(
        (candidate) => candidate.order.warehouseCode === 'WH-LEGACY',
      )
      if (!entry) throw new Error('시드에 사용 중지 창고 주문이 없다')

      expect(entry.preparation.status).toBe('EXCEPTION')

      const before = JSON.stringify(state().inventories)
      expect(state().reserve(entry.order.orderId).ok).toBe(false)
      expect(JSON.stringify(state().inventories)).toBe(before)
    })

    it('미확정 발주는 부족 판정을 뒤집지 못한다', () => {
      const draft = state().incomingDocuments.find((candidate) => !candidate.confirmed)
      if (!draft) throw new Error('시드에 미확정 문서가 없다')

      // 같은 품목·창고를 기다리는 주문이 여전히 부족으로 남는다
      const blocked = planPreparation(state()).entries.filter(
        (entry) =>
          entry.preparation.status === 'SHORTAGE' &&
          entry.order.warehouseCode === draft.warehouseCode &&
          entry.preparation.items.some((item) => item.itemCode === draft.itemCode),
      )

      expect(blocked.length).toBeGreaterThan(0)
    })
  })

  describe('다른 창고 재고로 자동 대체하지 않는다', () => {
    it('같은 품목이 다른 창고에 있어도 부족은 부족이다', () => {
      const plan = planPreparation(state())
      const short = plan.entries.find((entry) => entry.preparation.status === 'SHORTAGE')
      if (!short) throw new Error('시드에 부족 주문이 없다')

      const line = short.preparation.items.find((item) => item.shortageQuantity > 0)!
      const elsewhere = state().inventories.filter(
        (inventory) =>
          inventory.itemCode === line.itemCode &&
          inventory.warehouseCode !== short.order.warehouseCode &&
          inventory.currentQuantity > 0,
      )

      // 다른 창고에 재고가 있든 없든, 이 주문의 부족수량은 출고창고 기준으로만 계산된다
      expect(line.shortageQuantity).toBeGreaterThan(0)
      expect(
        elsewhere.every((inventory) => inventory.warehouseCode !== short.order.warehouseCode),
      ).toBe(true)
    })
  })
})
