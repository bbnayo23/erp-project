import { describe, expect, it } from 'vitest'
import type { ErpDatabase, IncomingDocument } from '@/types'
import { completeInspection, receiveIncoming } from '@/domain/purchase/receiveIncoming'
import { incomingRepository } from '@/data/repositories/incomingRepository'
import { BASE_AT, commit, db, incoming, inventory, inventoryOf, itemOf, serial } from '../fixtures'

/**
 * Case 8. 입고 중복 및 초과 (가이드 §16, §17, §20, §25, §28)
 *
 * 멱등성이 가장 중요한 자리다. 예약·출고는 Reservation 기록으로도 막을 수 있지만
 * 입고에는 그런 자연 키가 없다 — 계획 10개 문서에 3개를 두 번 넣으면 둘 다 정당한
 * 부분 입고로 보인다. 요청 ID 가 유일한 방어선이다.
 */
describe('입고', () => {
  const purchaseDoc = (overrides: Partial<IncomingDocument> = {}): IncomingDocument => ({
    ...incoming({ id: 'PO-1', itemCode: 'PIL-STD', plannedQuantity: 10, availableDay: 24 }),
    ...overrides,
  })

  const receive = (
    state: ErpDatabase,
    document: IncomingDocument,
    quantity: number,
    requestId = 'RCV-001',
    serialNumbers?: string[],
  ) =>
    receiveIncoming(state, {
      document,
      item: itemOf(document.itemCode),
      quantity,
      requestId,
      receivedAt: BASE_AT,
      ...(serialNumbers ? { serialNumbers } : {}),
    })

  describe('현재고 반영', () => {
    it('입고하면 현재고가 늘고 입고수량이 올라간다', () => {
      const base = db({ inventories: [inventory('PIL-STD', 2)] })
      const result = receive(base, purchaseDoc(), 3)

      expect(result.ok).toBe(true)
      expect(inventoryOf(result.inventories, 'PIL-STD').currentQuantity).toBe(5)
      expect(result.document.receivedQuantity).toBe(3)
      expect(result.document.status).toBe('부분 입고')
    })

    it('예약수량은 건드리지 않는다', () => {
      const base = db({ inventories: [inventory('PIL-STD', 2, 2)] })
      const result = receive(base, purchaseDoc(), 3)

      expect(inventoryOf(result.inventories, 'PIL-STD').reservedQuantity).toBe(2)
    })

    it('계획수량을 다 채우면 입고 완료가 된다', () => {
      const result = receive(db(), purchaseDoc({ receivedQuantity: 7 }), 3)

      expect(result.document.receivedQuantity).toBe(10)
      expect(result.document.status).toBe('입고 완료')
    })

    it('재고 행이 없던 품목은 새로 만든다', () => {
      const result = receive(db(), purchaseDoc(), 4)

      expect(inventoryOf(result.inventories, 'PIL-STD').currentQuantity).toBe(4)
      expect(inventoryOf(result.inventories, 'PIL-STD').reservedQuantity).toBe(0)
    })
  })

  /** 입고 누적수량은 계획수량을 넘을 수 없다 (§17.1) */
  describe('수량 제한', () => {
    it('잔여수량을 초과한 입고는 거부한다', () => {
      // 계획 10, 입고 8 → 남은 수량 2. 3개는 받을 수 없다.
      const result = receive(db(), purchaseDoc({ receivedQuantity: 8 }), 3)

      expect(result.failure).toBe('EXCEEDS_REMAINING')
      expect(result.document.receivedQuantity).toBe(8)
    })

    it('남은 수량만큼은 받을 수 있다', () => {
      const result = receive(db(), purchaseDoc({ receivedQuantity: 8 }), 2)

      expect(result.ok).toBe(true)
      expect(result.document.receivedQuantity).toBe(10)
    })

    it('잔여가 0 이면 추가 입고를 거부한다', () => {
      const result = receive(db(), purchaseDoc({ receivedQuantity: 10 }), 1)

      expect(result.failure).toBe('EXCEEDS_REMAINING')
    })

    it.each([0, -2])('수량이 %i 이면 거부한다', (quantity) => {
      expect(receive(db(), purchaseDoc(), quantity).failure).toBe('INVALID_QUANTITY')
    })

    it("확정되지 않은 '작성 중' 문서는 입고할 수 없다", () => {
      const result = receive(db(), purchaseDoc({ confirmed: false, status: '작성 중' }), 1)

      expect(result.failure).toBe('NOT_CONFIRMED')
    })
  })

  describe('중복 요청', () => {
    const afterFirst = (): ErpDatabase => {
      const base = db({
        inventories: [inventory('PIL-STD', 2)],
        incomingDocuments: [purchaseDoc()],
      })
      const first = receive(base, purchaseDoc(), 5)

      return commit(base, {
        inventories: first.inventories,
        serials: first.serials,
        incomingDocuments: incomingRepository.replace(base.incomingDocuments, first.document),
        processedRequests: first.processedRequests,
      })
    }

    it('같은 요청 ID 로 다시 입고하면 입고수량이 유지된다', () => {
      const state = afterFirst()
      const stored = incomingRepository.find(state.incomingDocuments, 'PO-1')
      const second = receive(state, stored ?? purchaseDoc(), 5, 'RCV-001')

      expect(second.failure).toBe('DUPLICATE_REQUEST')
      expect(second.document.receivedQuantity).toBe(5)
      expect(inventoryOf(second.inventories, 'PIL-STD').currentQuantity).toBe(7)
    })

    it('다른 요청 ID 면 남은 수량 안에서 추가 입고된다', () => {
      const state = afterFirst()
      const stored = incomingRepository.find(state.incomingDocuments, 'PO-1')
      const second = receive(state, stored ?? purchaseDoc(), 5, 'RCV-002')

      expect(second.ok).toBe(true)
      expect(second.document.receivedQuantity).toBe(10)
      expect(inventoryOf(second.inventories, 'PIL-STD').currentQuantity).toBe(12)
    })

    it('최종 입고수량은 항상 계획수량 이하다', () => {
      const state = afterFirst()
      const stored = incomingRepository.find(state.incomingDocuments, 'PO-1')
      const overshoot = receive(state, stored ?? purchaseDoc(), 6, 'RCV-003')

      expect(overshoot.failure).toBe('EXCEEDS_REMAINING')
      expect(overshoot.document.receivedQuantity).toBeLessThanOrEqual(10)
    })
  })

  /** 시리얼 관리 품목은 입고 수량만큼 실제 개체가 생겨야 한다 (§17.2) */
  describe('시리얼 품목 입고', () => {
    const serialDoc = purchaseDoc({ documentId: 'PO-FRM', itemCode: 'FRM-Q' })

    it('입고 수량만큼 개체가 생성된다', () => {
      const result = receive(db(), serialDoc, 3, 'RCV-001', ['FRM-9001', 'FRM-9002', 'FRM-9003'])

      expect(result.createdSerialNumbers).toEqual(['FRM-9001', 'FRM-9002', 'FRM-9003'])
      expect(result.serials).toHaveLength(3)
      expect(result.serials.every((item) => item.status === '창고 보관 중')).toBe(true)
    })

    it('현재고와 개체 수가 어긋나지 않는다', () => {
      const result = receive(db(), serialDoc, 2, 'RCV-001', ['FRM-9001', 'FRM-9002'])

      expect(inventoryOf(result.inventories, 'FRM-Q').currentQuantity).toBe(result.serials.length)
    })

    it('수량만큼의 개체번호가 오지 않으면 거부한다', () => {
      const result = receive(db(), serialDoc, 3, 'RCV-001', ['FRM-9001'])

      expect(result.failure).toBe('MISSING_SERIAL_NUMBERS')
      expect(result.serials).toHaveLength(0)
    })

    it('이미 존재하는 시리얼번호는 거부한다', () => {
      const base = db({ serials: [serial('FRM-9001', 'FRM-Q')] })
      const result = receive(base, serialDoc, 1, 'RCV-001', ['FRM-9001'])

      expect(result.failure).toBe('DUPLICATE_SERIAL')
      expect(result.serials).toBe(base.serials)
    })

    it('한 요청 안에서도 시리얼번호가 겹치면 거부한다', () => {
      const result = receive(db(), serialDoc, 2, 'RCV-001', ['FRM-9001', 'FRM-9001'])

      expect(result.failure).toBe('DUPLICATE_SERIAL')
    })

    it('비관리 품목은 개체를 만들지 않는다', () => {
      const result = receive(db(), purchaseDoc(), 3)

      expect(result.createdSerialNumbers).toEqual([])
      expect(result.serials).toHaveLength(0)
    })
  })

  /** 검사 결과 기록 없이 생산품을 현재고에 반영하지 않는다 (§16) */
  describe('생산품 품질검사', () => {
    const productionDoc = incoming({
      id: 'MO-1',
      itemCode: 'MAT-Q',
      plannedQuantity: 2,
      availableDay: 24,
      documentType: '생산',
      status: '생산 완료',
      inspectionStatus: '검사 대기',
      supplierCode: 'SUP-PROD',
    })

    it('검사가 끝나지 않으면 입고할 수 없다', () => {
      const result = receive(db(), productionDoc, 2, 'RCV-001', ['MAT-9001', 'MAT-9002'])

      expect(result.failure).toBe('INSPECTION_PENDING')
      expect(result.inventories).toHaveLength(0)
    })

    it.each(['검사 전', '검사 대기'] as const)('검사상태가 %s 면 막힌다', (inspectionStatus) => {
      const result = receive(db(), { ...productionDoc, inspectionStatus }, 1, 'RCV-001', [
        'MAT-9001',
      ])

      expect(result.failure).toBe('INSPECTION_PENDING')
    })

    it('검사를 통과하면 입고되어 현재고가 늘어난다', () => {
      const inspected = completeInspection(productionDoc)
      const result = receive(db(), inspected, 2, 'RCV-001', ['MAT-9001', 'MAT-9002'])

      expect(inspected.inspectionStatus).toBe('검사 완료')
      expect(result.ok).toBe(true)
      expect(inventoryOf(result.inventories, 'MAT-Q').currentQuantity).toBe(2)
    })

    it('검사가 필요 없는 매입품은 그대로 입고된다', () => {
      expect(receive(db(), purchaseDoc(), 1).ok).toBe(true)
    })

    it('이미 검사가 끝난 문서를 다시 통과시켜도 그대로다', () => {
      const once = completeInspection(productionDoc)

      expect(completeInspection(once)).toBe(once)
    })
  })
})
