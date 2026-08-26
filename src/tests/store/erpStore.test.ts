import { beforeEach, describe, expect, it } from 'vitest'
import type { OrderPreparation, PreparationStatus } from '@/types'
import { useErpStore } from '@/store/erpStore'
import { findPlanEntry, planPreparation } from '@/domain/preparation/planPreparation'
import { calculateShortage } from '@/domain/purchase/calculateShortage'
import { findInventory } from '@/domain/inventory/getAvailableQuantity'
import { isPreparationTarget } from '@/domain/preparation/preparationRules'

/**
 * 스토어를 실제 시드 데이터로 검증한다.
 *
 * 도메인 테스트는 손으로 세운 최소 데이터를 쓴다. 여기서는 반대로 엑셀 8개 시트를 그대로
 * 넣고 돌려본다 — 시드가 도메인 함수의 전제를 실제로 만족하는지, 스토어 액션이 컬렉션을
 * 빠뜨리지 않고 옮기는지는 진짜 데이터로만 드러난다.
 */
describe('erpStore', () => {
  const state = () => useErpStore.getState()
  const plan = () => planPreparation(state())

  beforeEach(() => {
    state().reset()
  })

  describe('시드 적재', () => {
    it('06_주문 행이 주문 단위로 접힌다', () => {
      // 시트는 주문 하나를 품목별 여러 행으로 갖고 있다
      expect(state().orders.length).toBeGreaterThan(0)
      expect(state().orders.every((order) => order.items.length > 0)).toBe(true)
    })

    it('앱이 만드는 컬렉션은 비어서 시작한다', () => {
      expect(state().reservations).toEqual([])
      expect(state().shipments).toEqual([])
      expect(state().processedRequests).toEqual([])
    })

    it('기준시각이 04_재고현황과 같다', () => {
      expect(state().baseAt).toBe('2026-07-21T09:00:00+09:00')
      expect(state().inventories.every((inventory) => inventory.baseAt === state().baseAt)).toBe(
        true,
      )
    })
  })

  describe('준비 계획', () => {
    it('준비 대상 주문만 계획에 오른다', () => {
      const targets = state().orders.filter(isPreparationTarget)

      expect(plan().entries).toHaveLength(targets.length)
      expect(plan().entries.length).toBeLessThan(state().orders.length)
    })

    it('배송예정일 순서로 우선순위가 매겨진다', () => {
      const dates = plan().entries.map((entry) => entry.order.deliveryDate)
      const sorted = [...dates].sort()

      expect(dates).toEqual(sorted)
      expect(plan().entries.map((entry) => entry.priority)).toEqual(
        plan().entries.map((_, index) => index + 1),
      )
    })

    /** 시드에는 네 상태가 모두 나와야 한다. 한 가지만 나오면 판정이 어딘가 막혀 있다. */
    it('시드가 네 상태를 모두 만든다', () => {
      const statuses = new Set(plan().entries.map((entry) => entry.preparation.status))

      expect([...statuses].sort()).toEqual<PreparationStatus[]>([
        'EXCEPTION',
        'READY',
        'SHORTAGE',
        'WAITING',
      ])
    })

    it('EXCEPTION 주문에는 담당자가 읽을 사유가 있다', () => {
      const exceptions = plan().entries.filter((entry) => entry.preparation.status === 'EXCEPTION')

      expect(exceptions.length).toBeGreaterThan(0)
      expect(exceptions.every((entry) => entry.preparation.blockingReasons.length > 0)).toBe(true)
    })

    it('부족분은 발주가 필요한 것만 남는다', () => {
      const lines = calculateShortage(plan())

      expect(lines.length).toBeGreaterThan(0)
      expect(lines.every((line) => line.shortageQuantity > 0)).toBe(true)
      expect(lines.every((line) => line.orderIds.length > 0)).toBe(true)
    })
  })

  /** 시드에서 준비 가능한 주문 하나를 찾는다 — 없으면 시드나 판정이 잘못된 것이다 */
  const readyOrder = () => {
    const entry = plan().entries.find((candidate) => candidate.preparation.status === 'READY')
    if (!entry) throw new Error('시드에 READY 주문이 없다')
    return entry
  }

  const quantityOf = (preparation: OrderPreparation) =>
    preparation.items.reduce((acc, item) => acc + item.requiredQuantity, 0)

  describe('예약', () => {
    it('예약수량만 늘고 현재고는 그대로다', () => {
      const { order, preparation } = readyOrder()
      const line = preparation.items[0]
      if (!line) throw new Error('준비 품목이 없다')

      const before = findInventory(state().inventories, line.itemCode, order.warehouseCode)
      const outcome = state().reserve(order.orderId)
      const after = findInventory(state().inventories, line.itemCode, order.warehouseCode)

      expect(outcome.ok).toBe(true)
      expect(after?.currentQuantity).toBe(before?.currentQuantity)
      expect(after?.reservedQuantity).toBe((before?.reservedQuantity ?? 0) + line.requiredQuantity)
    })

    it('예약 기록과 처리 이력이 함께 남는다', () => {
      const { order } = readyOrder()
      state().reserve(order.orderId)

      expect(state().reservations.map((reservation) => reservation.orderId)).toEqual([
        order.orderId,
      ])
      expect(state().processedRequests).toEqual([
        { requestId: `RESERVE:${order.orderId}`, kind: 'RESERVE', processedAt: state().baseAt },
      ])
    })

    it('같은 주문을 두 번 예약해도 예약수량은 한 번만 늘어난다', () => {
      const { order, preparation } = readyOrder()
      const line = preparation.items[0]
      if (!line) throw new Error('준비 품목이 없다')

      state().reserve(order.orderId)
      const afterFirst = findInventory(state().inventories, line.itemCode, order.warehouseCode)

      const second = state().reserve(order.orderId)
      const afterSecond = findInventory(state().inventories, line.itemCode, order.warehouseCode)

      expect(second.ok).toBe(false)
      expect(second.code).toBe('DUPLICATE_REQUEST')
      expect(afterSecond?.reservedQuantity).toBe(afterFirst?.reservedQuantity)
      expect(state().reservations).toHaveLength(1)
    })

    /**
     * 예약된 주문을 다시 배정하면 자기 예약 때문에 자기가 부족해진다.
     * 현재고 5 중 3을 예약하면 가용은 2인데 소요는 여전히 3으로 잡혀, 있는 재고를 두고
     * 발주가 나간다. 그래서 예약된 주문은 원장을 건드리지 않는다.
     */
    it('예약된 주문은 배정 경쟁에서 빠지고 준비 상태를 유지한다', () => {
      const { order } = readyOrder()
      state().reserve(order.orderId)

      const entry = findPlanEntry(plan(), order.orderId)

      expect(entry?.reserved).toBe(true)
      expect(entry?.preparation.status).toBe('READY')
      expect(entry?.preparation.items.every((item) => item.shortageQuantity === 0)).toBe(true)
    })

    it('예약된 주문 때문에 부족분이 생기지 않는다', () => {
      const { order, preparation } = readyOrder()
      const reservedItems = new Set(preparation.items.map((item) => item.itemCode))

      const before = calculateShortage(plan()).filter((line) => reservedItems.has(line.itemCode))
      state().reserve(order.orderId)
      const after = calculateShortage(plan()).filter((line) => reservedItems.has(line.itemCode))

      expect(after).toEqual(before)
    })

    it('없는 주문은 거부한다', () => {
      expect(state().reserve('ORD-NOPE').code).toBe('ORDER_NOT_FOUND')
    })

    it('준비되지 않은 주문은 예약하지 않는다', () => {
      const entry = plan().entries.find((candidate) => candidate.preparation.status === 'SHORTAGE')
      if (!entry) throw new Error('시드에 SHORTAGE 주문이 없다')

      expect(state().reserve(entry.order.orderId).code).toBe('NOT_READY')
      expect(state().reservations).toHaveLength(0)
    })
  })

  describe('예약 해제', () => {
    it('예약수량이 원래대로 돌아온다', () => {
      const { order, preparation } = readyOrder()
      const line = preparation.items[0]
      if (!line) throw new Error('준비 품목이 없다')

      const before = findInventory(state().inventories, line.itemCode, order.warehouseCode)

      state().reserve(order.orderId)
      state().release(order.orderId)

      const after = findInventory(state().inventories, line.itemCode, order.warehouseCode)

      expect(after?.reservedQuantity).toBe(before?.reservedQuantity)
      expect(state().reservations).toHaveLength(0)
    })

    it('예약이 없으면 거부한다', () => {
      expect(state().release('ORD-NOPE').code).toBe('NOT_RESERVED')
    })
  })

  describe('출고', () => {
    it('현재고와 예약수량이 함께 줄고 이력이 남는다', () => {
      const { order, preparation } = readyOrder()
      const line = preparation.items[0]
      if (!line) throw new Error('준비 품목이 없다')

      const before = findInventory(state().inventories, line.itemCode, order.warehouseCode)

      state().reserve(order.orderId)
      const outcome = state().ship(order.orderId)

      const after = findInventory(state().inventories, line.itemCode, order.warehouseCode)

      expect(outcome.ok).toBe(true)
      expect(after?.currentQuantity).toBe((before?.currentQuantity ?? 0) - line.requiredQuantity)
      expect(after?.reservedQuantity).toBe(before?.reservedQuantity)
      expect(state().shipments).toHaveLength(1)
      expect(state().reservations).toHaveLength(0)
    })

    it('출고 이력에 내보낸 수량이 그대로 남는다', () => {
      const { order, preparation } = readyOrder()

      state().reserve(order.orderId)
      state().ship(order.orderId)

      const shipment = state().shipments[0]
      const shipped = shipment?.lines.reduce((acc, shipLine) => acc + shipLine.quantity, 0)

      expect(shipment?.orderId).toBe(order.orderId)
      expect(shipped).toBe(quantityOf(preparation))
    })

    it('예약 없이 출고할 수 없다', () => {
      const { order } = readyOrder()

      expect(state().ship(order.orderId).code).toBe('NOT_RESERVED')
      expect(state().shipments).toHaveLength(0)
    })

    it('같은 주문을 두 번 출고해도 현재고는 한 번만 줄어든다', () => {
      const { order, preparation } = readyOrder()
      const line = preparation.items[0]
      if (!line) throw new Error('준비 품목이 없다')

      state().reserve(order.orderId)
      state().ship(order.orderId)
      const afterFirst = findInventory(state().inventories, line.itemCode, order.warehouseCode)

      const second = state().ship(order.orderId)
      const afterSecond = findInventory(state().inventories, line.itemCode, order.warehouseCode)

      expect(second.ok).toBe(false)
      expect(afterSecond?.currentQuantity).toBe(afterFirst?.currentQuantity)
      expect(state().shipments).toHaveLength(1)
    })

    it('출고한 주문은 준비 대상에서 빠진다', () => {
      const { order } = readyOrder()
      const before = plan().entries.length

      state().reserve(order.orderId)
      state().ship(order.orderId)

      expect(plan().entries).toHaveLength(before - 1)
      expect(findPlanEntry(plan(), order.orderId)).toBeUndefined()
    })
  })

  describe('발주', () => {
    it('부족분으로 문서를 만들고 현재고는 그대로 둔다', () => {
      const lines = calculateShortage(plan())
      const beforeDocuments = state().incomingDocuments.length
      const beforeInventories = state().inventories.map((inventory) => inventory.currentQuantity)

      const outcome = state().issueIncoming(lines, 'PO-REQ-001')

      expect(outcome.ok).toBe(true)
      expect(state().incomingDocuments.length).toBeGreaterThan(beforeDocuments)
      expect(state().inventories.map((inventory) => inventory.currentQuantity)).toEqual(
        beforeInventories,
      )
    })

    /**
     * 문서번호는 품목코드에서 만들어지므로 같은 품목이 창고만 달라도 기준 번호가 같다.
     * 한 번의 발주 안에서 이미 발급한 번호를 후보에서 빼지 않으면 두 문서가 겹친다.
     */
    it('한 번의 발주에서 문서번호가 겹치지 않는다', () => {
      state().issueIncoming(calculateShortage(plan()), 'PO-REQ-001')

      const ids = state().incomingDocuments.map((document) => document.documentId)

      expect(new Set(ids).size).toBe(ids.length)
    })

    it('같은 요청 ID 로 다시 발주하면 문서가 늘지 않는다', () => {
      const lines = calculateShortage(plan())

      state().issueIncoming(lines, 'PO-REQ-001')
      const afterFirst = state().incomingDocuments.length

      const second = state().issueIncoming(lines, 'PO-REQ-001')

      expect(second.code).toBe('DUPLICATE_REQUEST')
      expect(state().incomingDocuments).toHaveLength(afterFirst)
    })

    it('발주하면 부족분이 줄어든다', () => {
      const before = calculateShortage(plan())
      state().issueIncoming(before, 'PO-REQ-001')
      const after = calculateShortage(plan())

      // 배송일을 맞출 수 있는 발주만큼 부족분이 사라진다
      expect(after.length).toBeLessThan(before.length)
    })
  })

  describe('입고', () => {
    /** 검사가 필요 없고 잔여가 남은 확정 문서 */
    const receivable = () => {
      const document = state().incomingDocuments.find(
        (candidate) =>
          candidate.confirmed &&
          candidate.inspectionStatus === '해당 없음' &&
          candidate.plannedQuantity > candidate.receivedQuantity,
      )
      if (!document) throw new Error('시드에 입고 가능한 문서가 없다')
      return document
    }

    it('현재고가 입고 수량만큼 늘어난다', () => {
      const document = receivable()
      const before = findInventory(state().inventories, document.itemCode, document.warehouseCode)

      const outcome = state().receive(document.documentId, 1, 'RCV-001')

      const after = findInventory(state().inventories, document.itemCode, document.warehouseCode)

      expect(outcome.ok).toBe(true)
      expect(after?.currentQuantity).toBe((before?.currentQuantity ?? 0) + 1)
    })

    it('시리얼 관리 품목은 개체도 함께 생긴다', () => {
      const document = state().incomingDocuments.find((candidate) => {
        const item = state().items.find((entry) => entry.itemCode === candidate.itemCode)
        return (
          candidate.confirmed &&
          candidate.inspectionStatus === '해당 없음' &&
          candidate.plannedQuantity > candidate.receivedQuantity &&
          item?.serialManaged === true
        )
      })
      if (!document) throw new Error('시드에 시리얼 품목 입고예정이 없다')

      const before = state().serials.length
      state().receive(document.documentId, 2, 'RCV-001')

      expect(state().serials).toHaveLength(before + 2)
      expect(new Set(state().serials.map((serial) => serial.serialNumber)).size).toBe(
        state().serials.length,
      )
    })

    it('같은 요청 ID 로 다시 입고하면 현재고가 늘지 않는다', () => {
      const document = receivable()

      state().receive(document.documentId, 1, 'RCV-001')
      const afterFirst = findInventory(
        state().inventories,
        document.itemCode,
        document.warehouseCode,
      )

      const second = state().receive(document.documentId, 1, 'RCV-001')
      const afterSecond = findInventory(
        state().inventories,
        document.itemCode,
        document.warehouseCode,
      )

      expect(second.code).toBe('DUPLICATE_REQUEST')
      expect(afterSecond?.currentQuantity).toBe(afterFirst?.currentQuantity)
    })

    it('잔여수량을 넘겨 입고할 수 없다', () => {
      const document = receivable()
      const over = document.plannedQuantity - document.receivedQuantity + 1

      expect(state().receive(document.documentId, over, 'RCV-001').code).toBe('EXCEEDS_REMAINING')
    })

    it('없는 문서는 거부한다', () => {
      expect(state().receive('PO-NOPE', 1, 'RCV-001').code).toBe('DOCUMENT_NOT_FOUND')
    })
  })

  describe('품질검사', () => {
    const pending = () => {
      const document = state().incomingDocuments.find(
        (candidate) =>
          candidate.inspectionStatus === '검사 대기' || candidate.inspectionStatus === '검사 전',
      )
      if (!document) throw new Error('시드에 검사 대기 문서가 없다')
      return document
    }

    it('검사 전에는 입고할 수 없다', () => {
      expect(state().receive(pending().documentId, 1, 'RCV-001').code).toBe('INSPECTION_PENDING')
    })

    it('검사를 통과시키면 입고할 수 있게 된다', () => {
      const document = pending()

      expect(state().inspect(document.documentId).ok).toBe(true)
      expect(state().receive(document.documentId, 1, 'RCV-001').ok).toBe(true)
    })

    it('이미 통과한 문서는 다시 통과시킬 것이 없다', () => {
      const document = pending()
      state().inspect(document.documentId)

      expect(state().inspect(document.documentId).code).toBe('NOT_PENDING_INSPECTION')
    })
  })

  it('reset 은 시드 상태로 되돌린다', () => {
    const { order } = readyOrder()
    state().reserve(order.orderId)
    state().reset()

    expect(state().reservations).toEqual([])
    expect(state().processedRequests).toEqual([])
  })
})
