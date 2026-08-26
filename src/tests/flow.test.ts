import { describe, expect, it } from 'vitest'
import type { ErpDatabase } from '@/types'
import { planPreparation, reevaluateWaitingOrders } from '@/domain/preparation/planPreparation'
import { calculateShortage } from '@/domain/purchase/calculateShortage'
import { issueIncomingDocuments } from '@/domain/purchase/issueIncomingDocuments'
import { receiveIncoming } from '@/domain/purchase/receiveIncoming'
import { reserveOrder } from '@/domain/inventory/reserveOrder'
import { shipOrder } from '@/domain/inventory/shipOrder'
import { incomingRepository } from '@/data/repositories/incomingRepository'
import { BASE_AT, commit, db, entryOf, inventory, inventoryOf, itemOf, order } from './fixtures'

/**
 * Case 7 꼬리 · 가이드 §18 · §31 Step 11 — 전체 흐름 한 바퀴.
 *
 * 입고는 단순한 재고 증가 이벤트가 아니라 대기 중인 주문을 다시 풀어주는 트리거다.
 * 단계별로는 다 맞는데 이어붙이면 숫자가 어긋나는 경우를 잡기 위한 테스트다.
 */
describe('주문 → 부족 → 발주 → 입고 → 재판정 → 예약 → 출고', () => {
  const target = order({
    id: 'ORD-001',
    deliveryDay: 28,
    items: [{ itemCode: 'PIL-STD', quantity: 5 }],
  })

  it('재고 없는 주문이 발주 한 바퀴를 돌아 출고까지 간다', () => {
    let state: ErpDatabase = db({ orders: [target] })

    // 1. 재고가 없으니 부족하다
    const shortage = calculateShortage(planPreparation(state))
    expect(entryOf(planPreparation(state), 'ORD-001').preparation.status).toBe('SHORTAGE')
    expect(shortage[0]?.shortageQuantity).toBe(5)

    // 2. 부족분으로 구매발주를 만든다. 현재고는 아직 그대로다.
    const issued = issueIncomingDocuments(state, {
      lines: shortage,
      requestId: 'PO-REQ-001',
      orderedAt: BASE_AT,
      makeDocumentId: (line, documentType) =>
        incomingRepository.nextDocumentId(
          state.incomingDocuments,
          documentType,
          line.itemCode,
          BASE_AT,
        ),
    })
    state = commit(state, {
      incomingDocuments: issued.incomingDocuments,
      processedRequests: issued.processedRequests,
    })

    expect(issued.created).toHaveLength(1)
    expect(state.inventories).toHaveLength(0)

    // 3. 발주가 배송일(07/28) 전에 도착할 예정이라 대기로 바뀐다
    expect(entryOf(planPreparation(state), 'ORD-001').preparation.status).toBe('WAITING')
    expect(calculateShortage(planPreparation(state))).toEqual([])

    // 4. 입고되면 현재고가 늘어난다
    const document = issued.created[0]
    if (!document) throw new Error('발주 문서가 없다')

    const received = receiveIncoming(state, {
      document,
      item: itemOf('PIL-STD'),
      quantity: 5,
      requestId: 'RCV-001',
      receivedAt: BASE_AT,
    })
    state = commit(state, {
      inventories: received.inventories,
      serials: received.serials,
      incomingDocuments: incomingRepository.replace(state.incomingDocuments, received.document),
      processedRequests: received.processedRequests,
    })

    expect(inventoryOf(state.inventories, 'PIL-STD').currentQuantity).toBe(5)

    // 5. 재판정하면 준비 가능해진다
    const plan = reevaluateWaitingOrders(state)
    const entry = entryOf(plan, 'ORD-001')
    expect(entry.preparation.status).toBe('READY')

    // 6. 예약 — 현재고는 그대로, 예약수량만 늘어난다
    const reserved = reserveOrder(state, {
      order: target,
      preparation: entry.preparation,
      requestId: 'REQ-001',
      reservedAt: BASE_AT,
    })
    state = commit(state, {
      inventories: reserved.inventories,
      serials: reserved.serials,
      reservations: reserved.reservations,
      processedRequests: reserved.processedRequests,
    })

    expect(inventoryOf(state.inventories, 'PIL-STD').currentQuantity).toBe(5)
    expect(inventoryOf(state.inventories, 'PIL-STD').reservedQuantity).toBe(5)

    // 7. 출고 — 현재고와 예약수량이 함께 0 이 되고 이력이 남는다
    const shipped = shipOrder(state, {
      order: target,
      requestId: 'SHIP-001',
      shippedAt: BASE_AT,
    })
    state = commit(state, {
      inventories: shipped.inventories,
      serials: shipped.serials,
      reservations: shipped.reservations,
      orders: shipped.orders,
      shipments: shipped.shipments,
      processedRequests: shipped.processedRequests,
    })

    expect(inventoryOf(state.inventories, 'PIL-STD').currentQuantity).toBe(0)
    expect(inventoryOf(state.inventories, 'PIL-STD').reservedQuantity).toBe(0)
    expect(state.shipments).toHaveLength(1)
    expect(state.reservations).toHaveLength(0)

    // 재고를 바꾼 요청 네 건이 모두 이력에 남는다
    expect(state.processedRequests.map((request) => request.kind)).toEqual([
      'ISSUE_INCOMING',
      'RECEIVE',
      'RESERVE',
      'SHIP',
    ])
  })

  /**
   * 입고로 늘어난 재고를 한 주문만 다시 판정하면 안 된다.
   * 배송일이 더 빠른 다른 대기 주문이 먼저 가져가야 한다.
   */
  it('입고분은 배송일이 빠른 대기 주문에게 먼저 간다', () => {
    const base = db({
      orders: [
        order({ id: 'ORD-LATE', deliveryDay: 27, items: [{ itemCode: 'PIL-STD', quantity: 1 }] }),
        order({ id: 'ORD-EARLY', deliveryDay: 22, items: [{ itemCode: 'PIL-STD', quantity: 1 }] }),
      ],
    })

    const before = planPreparation(base)
    expect(entryOf(before, 'ORD-EARLY').preparation.status).toBe('SHORTAGE')
    expect(entryOf(before, 'ORD-LATE').preparation.status).toBe('SHORTAGE')

    // 1개만 입고된다
    const state = commit(base, { inventories: [inventory('PIL-STD', 1)] })
    const after = reevaluateWaitingOrders(state)

    expect(entryOf(after, 'ORD-EARLY').preparation.status).toBe('READY')
    expect(entryOf(after, 'ORD-LATE').preparation.status).toBe('SHORTAGE')
  })

  /** 발주는 부족분만 만든다. 이미 나간 발주 때문에 대기 중인 주문에 또 발주하면 재고가 남는다. */
  it('같은 부족분에 발주가 두 번 나가지 않는다', () => {
    const base = db({ orders: [target] })
    const shortage = calculateShortage(planPreparation(base))

    const issued = issueIncomingDocuments(base, {
      lines: shortage,
      requestId: 'PO-REQ-001',
      orderedAt: BASE_AT,
      makeDocumentId: () => 'PO-20260721-STD',
    })
    const state = commit(base, {
      incomingDocuments: issued.incomingDocuments,
      processedRequests: issued.processedRequests,
    })

    // 발주가 배송일을 맞추므로 더 발주할 것이 없다
    expect(calculateShortage(planPreparation(state))).toEqual([])
  })
})
