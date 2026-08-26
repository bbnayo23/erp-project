import { describe, expect, it } from 'vitest'
import { evaluateOrder } from '@/domain/preparation/evaluateOrder'
import { db, incoming, inventory, lineOf, order } from '../fixtures'

/**
 * Case 3. 준비 상태 판정 (가이드 §7, §8, §9, §10, §28)
 *
 * 네 상태는 서로 다른 다음 행동을 뜻한다.
 *   READY    지금 예약·피킹·출고
 *   WAITING  기다리면 풀린다 — 발주하면 이중 발주다
 *   SHORTAGE 기다려도 안 온다 — 발주해야 한다
 * WAITING 과 SHORTAGE 를 잘못 가르면 재고가 남거나 납기를 놓친다.
 */
describe('준비 상태 판정', () => {
  const orderFor = (quantity: number, deliveryDay = 25) =>
    order({ id: 'ORD-001', deliveryDay, items: [{ itemCode: 'PIL-STD', quantity }] })

  describe('가용재고', () => {
    it('가용재고로 전량 채우면 READY 다', () => {
      const preparation = evaluateOrder(
        db({ inventories: [inventory('PIL-STD', 10)] }),
        orderFor(4),
      )

      expect(preparation.status).toBe('READY')
      expect(lineOf(preparation, 'PIL-STD').allocatedFromStock).toBe(4)
      expect(lineOf(preparation, 'PIL-STD').allocatedFromIncoming).toBe(0)
    })

    it('가용재고는 현재고에서 예약수량을 뺀 값이다', () => {
      // 현재고 10, 예약 6 → 가용 4
      const context = db({ inventories: [inventory('PIL-STD', 10, 6)] })

      expect(lineOf(evaluateOrder(context, orderFor(4)), 'PIL-STD').availableQuantity).toBe(4)
      expect(evaluateOrder(context, orderFor(4)).status).toBe('READY')
      expect(evaluateOrder(context, orderFor(5)).status).toBe('SHORTAGE')
    })

    it('다른 창고의 재고는 합산하지 않는다', () => {
      const context = db({
        inventories: [inventory('PIL-STD', 0, 0, 'WH-01'), inventory('PIL-STD', 99, 0, 'WH-02')],
      })

      expect(evaluateOrder(context, orderFor(1)).status).toBe('SHORTAGE')
    })
  })

  describe('입고예정', () => {
    it('배송일 전에 도착하는 확정 발주가 채우면 WAITING 이다', () => {
      const context = db({
        inventories: [inventory('PIL-STD', 2)],
        incomingDocuments: [
          incoming({ id: 'PO-1', itemCode: 'PIL-STD', plannedQuantity: 3, availableDay: 24 }),
        ],
      })

      const line = lineOf(evaluateOrder(context, orderFor(5)), 'PIL-STD')

      expect(line.status).toBe('WAITING')
      expect(line.waitingReason).toBe('PURCHASE')
      expect(line.allocatedFromStock).toBe(2)
      expect(line.allocatedFromIncoming).toBe(3)
      expect(line.incomingDocumentIds).toEqual(['PO-1'])
    })

    it('입고예정까지 더해도 모자라면 SHORTAGE 다', () => {
      const context = db({
        inventories: [inventory('PIL-STD', 2)],
        incomingDocuments: [
          incoming({ id: 'PO-1', itemCode: 'PIL-STD', plannedQuantity: 3, availableDay: 24 }),
        ],
      })

      const line = lineOf(evaluateOrder(context, orderFor(10)), 'PIL-STD')

      expect(line.status).toBe('SHORTAGE')
      // 부족수량 = 필요 - (가용 + 사용 가능한 입고예정) = 10 - (2 + 3)
      expect(line.shortageQuantity).toBe(5)
    })

    it("확정여부가 '아니오' 인 문서는 세지 않는다", () => {
      const context = db({
        incomingDocuments: [
          incoming({
            id: 'PO-DRAFT',
            itemCode: 'PIL-STD',
            plannedQuantity: 10,
            availableDay: 24,
            confirmed: false,
            status: '작성 중',
          }),
        ],
      })

      expect(evaluateOrder(context, orderFor(1)).status).toBe('SHORTAGE')
    })

    /** 잔여 입고수량 = 계획수량 - 입고수량. 이미 들어온 4개는 현재고에 있다. */
    it('부분 입고분은 현재고와 입고예정에 이중으로 세지 않는다', () => {
      const context = db({
        inventories: [inventory('PIL-STD', 4)],
        incomingDocuments: [
          incoming({
            id: 'PO-1',
            itemCode: 'PIL-STD',
            plannedQuantity: 10,
            receivedQuantity: 4,
            availableDay: 24,
            status: '부분 입고',
          }),
        ],
      })

      const line = lineOf(evaluateOrder(context, orderFor(10)), 'PIL-STD')

      expect(line.incomingQuantity).toBe(6)
      expect(line.status).toBe('WAITING')
      expect(line.shortageQuantity).toBe(0)
    })
  })

  /**
   * 배송일 전날까지 들어와야 실제로 쓸 수 있다 (§8).
   * 이 경계가 없으면 배송일 지나 도착하는 발주까지 '입고 대기' 로 보여, 발주가 나가야 할
   * 주문이 조용히 묻힌다.
   */
  describe('배송일 경계', () => {
    it.each([
      [23, 'WAITING'],
      [24, 'WAITING'],
      [25, 'SHORTAGE'],
      [26, 'SHORTAGE'],
    ] as const)('배송일 07/25, 도착 07/%i → %s', (availableDay, expected) => {
      const context = db({
        incomingDocuments: [
          incoming({ id: 'PO-1', itemCode: 'PIL-STD', plannedQuantity: 5, availableDay }),
        ],
      })

      expect(evaluateOrder(context, orderFor(5, 25)).status).toBe(expected)
    })
  })

  describe('대기 원인', () => {
    const productionDoc = (inspectionStatus: '검사 전' | '검사 대기') =>
      db({
        incomingDocuments: [
          incoming({
            id: 'MO-1',
            itemCode: 'MAT-Q',
            plannedQuantity: 1,
            availableDay: 24,
            documentType: '생산',
            status: inspectionStatus === '검사 대기' ? '생산 완료' : '진행 중',
            inspectionStatus,
            supplierCode: 'SUP-PROD',
          }),
        ],
      })

    const matOrder = order({ id: 'ORD-001', items: [{ itemCode: 'MAT-Q', quantity: 1 }] })

    it('생산 중이면 생산 완료를 기다린다', () => {
      const line = lineOf(evaluateOrder(productionDoc('검사 전'), matOrder), 'MAT-Q')

      expect(line.status).toBe('WAITING')
      expect(line.waitingReason).toBe('PRODUCTION')
    })

    it('생산은 끝났고 검사가 남았으면 품질검사를 기다린다', () => {
      const line = lineOf(evaluateOrder(productionDoc('검사 대기'), matOrder), 'MAT-Q')

      expect(line.status).toBe('WAITING')
      expect(line.waitingReason).toBe('QUALITY_INSPECTION')
    })

    it('READY 면 대기 원인이 없다', () => {
      const line = lineOf(
        evaluateOrder(db({ inventories: [inventory('PIL-STD', 5)] }), orderFor(1)),
        'PIL-STD',
      )

      expect(line.waitingReason).toBeUndefined()
      expect(line.incomingDocumentIds).toEqual([])
    })
  })

  /** 주문은 필요한 모든 품목을 준비할 수 있을 때만 READY 다 */
  it('주문 상태는 품목 중 가장 나쁜 것을 따른다', () => {
    const preparation = evaluateOrder(
      db({
        inventories: [inventory('MAT-Q', 5), inventory('FRM-Q', 5), inventory('PIL-STD', 0)],
      }),
      order({ id: 'ORD-001', items: [{ itemCode: 'SET-001', quantity: 1 }] }),
    )

    expect(lineOf(preparation, 'MAT-Q').status).toBe('READY')
    expect(lineOf(preparation, 'PIL-STD').status).toBe('SHORTAGE')
    expect(preparation.status).toBe('SHORTAGE')
  })
})
