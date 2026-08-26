import { describe, expect, it } from 'vitest'
import type { ErpDatabase } from '@/types'
import { planPreparation } from '@/domain/preparation/planPreparation'
import { calculateShortage, type ShortageLine } from '@/domain/purchase/calculateShortage'
import { issueIncomingDocuments } from '@/domain/purchase/issueIncomingDocuments'
import { incomingRepository } from '@/data/repositories/incomingRepository'
import { BASE_AT, db, incoming, inventory, inventoryOf, order } from '../fixtures'

/**
 * Case 7. 부족 → 발주/생산의뢰 (가이드 §14, §15, §16, §28)
 */
describe('부족수량 계산', () => {
  const shortageOf = (base: ErpDatabase) => calculateShortage(planPreparation(base))

  it('가용재고와 사용 가능한 입고예정을 뺀 나머지가 부족수량이다', () => {
    const lines = shortageOf(
      db({
        inventories: [inventory('PIL-STD', 2)],
        incomingDocuments: [
          incoming({ id: 'PO-1', itemCode: 'PIL-STD', plannedQuantity: 3, availableDay: 23 }),
        ],
        orders: [order({ id: 'ORD-001', items: [{ itemCode: 'PIL-STD', quantity: 10 }] })],
      }),
    )

    expect(lines).toEqual([
      {
        itemCode: 'PIL-STD',
        warehouseCode: 'WH-01',
        requiredQuantity: 10,
        shortageQuantity: 5,
        orderIds: ['ORD-001'],
      },
    ])
  })

  /**
   * 가용재고 1개를 두 주문이 각각 1개씩 원하면 실제 부족은 1개다.
   * 주문별 부족(0 + 0)을 더하면 0 이 되고, 재고를 여기서 다시 빼면 이미 배정된 몫을
   * 두 번 빼게 된다. 순차 배정이 이 문제를 계획 단계에서 이미 풀어놓는다.
   */
  it('부족분을 주문별로 더해도 재고가 두 번 빠지지 않는다', () => {
    const lines = shortageOf(
      db({
        inventories: [inventory('PIL-STD', 1)],
        orders: [
          order({ id: 'ORD-001', deliveryDay: 22, items: [{ itemCode: 'PIL-STD', quantity: 1 }] }),
          order({ id: 'ORD-002', deliveryDay: 23, items: [{ itemCode: 'PIL-STD', quantity: 1 }] }),
        ],
      }),
    )

    expect(lines).toHaveLength(1)
    expect(lines[0]?.shortageQuantity).toBe(1)
    expect(lines[0]?.orderIds).toEqual(['ORD-002'])
  })

  it('같은 품목 × 창고의 부족분은 한 줄로 합쳐진다', () => {
    const lines = shortageOf(
      db({
        orders: [
          order({ id: 'ORD-001', deliveryDay: 22, items: [{ itemCode: 'PIL-STD', quantity: 3 }] }),
          order({ id: 'ORD-002', deliveryDay: 23, items: [{ itemCode: 'PIL-STD', quantity: 2 }] }),
        ],
      }),
    )

    expect(lines).toHaveLength(1)
    expect(lines[0]?.shortageQuantity).toBe(5)
    expect(lines[0]?.orderIds).toEqual(['ORD-001', 'ORD-002'])
  })

  it('창고가 다르면 따로 계산한다', () => {
    const lines = shortageOf(
      db({
        orders: [
          order({
            id: 'ORD-001',
            warehouseCode: 'WH-01',
            items: [{ itemCode: 'PIL-STD', quantity: 1 }],
          }),
          order({
            id: 'ORD-002',
            warehouseCode: 'WH-02',
            items: [{ itemCode: 'PIL-STD', quantity: 2 }],
          }),
        ],
      }),
    )

    expect(lines.map((line) => [line.warehouseCode, line.shortageQuantity]).sort()).toEqual([
      ['WH-01', 1],
      ['WH-02', 2],
    ])
  })

  it('READY 와 WAITING 주문은 부족분을 내지 않는다', () => {
    const lines = shortageOf(
      db({
        inventories: [inventory('PIL-STD', 5)],
        incomingDocuments: [
          incoming({ id: 'PO-1', itemCode: 'MAT-Q', plannedQuantity: 5, availableDay: 23 }),
        ],
        orders: [
          order({ id: 'ORD-READY', items: [{ itemCode: 'PIL-STD', quantity: 5 }] }),
          order({ id: 'ORD-WAIT', items: [{ itemCode: 'MAT-Q', quantity: 5 }] }),
        ],
      }),
    )

    expect(lines).toEqual([])
  })

  it('EXCEPTION 주문은 발주 대상이 아니다', () => {
    const lines = shortageOf(
      db({
        orders: [
          order({ id: 'ORD-BAD', items: [{ itemCode: 'UNKNOWN-SKU', quantity: 5 }] }),
          order({
            id: 'ORD-LEGACY',
            warehouseCode: 'WH-LEGACY',
            items: [{ itemCode: 'PIL-STD', quantity: 5 }],
          }),
        ],
      }),
    )

    expect(lines).toEqual([])
  })
})

describe('발주·생산의뢰 생성', () => {
  const issue = (base: ErpDatabase, lines: readonly ShortageLine[], requestId = 'PO-REQ-001') =>
    issueIncomingDocuments(base, {
      lines,
      requestId,
      orderedAt: BASE_AT,
      makeDocumentId: (line, documentType) =>
        incomingRepository.nextDocumentId(
          base.incomingDocuments,
          documentType,
          line.itemCode,
          BASE_AT,
        ),
    })

  const line = (overrides: Partial<ShortageLine> = {}): ShortageLine => ({
    itemCode: 'PIL-STD',
    warehouseCode: 'WH-01',
    requiredQuantity: 5,
    shortageQuantity: 5,
    orderIds: ['ORD-001'],
    ...overrides,
  })

  it('매입품은 구매발주가 된다', () => {
    const result = issue(db(), [line({ itemCode: 'PIL-STD' })])

    expect(result.ok).toBe(true)
    expect(result.created[0]?.documentType).toBe('구매')
    expect(result.created[0]?.documentId).toBe('PO-20260721-STD')
    expect(result.created[0]?.inspectionStatus).toBe('해당 없음')
  })

  it('생산품은 생산의뢰가 되고 검사 공정을 거친다', () => {
    const result = issue(db(), [line({ itemCode: 'MAT-Q' })])

    expect(result.created[0]?.documentType).toBe('생산')
    expect(result.created[0]?.documentId).toBe('MO-20260721-Q')
    expect(result.created[0]?.inspectionStatus).toBe('검사 전')
  })

  it('사용가능예정일은 공급처 리드타임으로 계산한다', () => {
    // SUP-BUY 리드타임 3일, SUP-PROD 5일
    expect(issue(db(), [line({ itemCode: 'PIL-STD' })]).created[0]?.availableDate).toBe(
      '2026-07-24T09:00:00+09:00',
    )
    expect(issue(db(), [line({ itemCode: 'MAT-Q' })]).created[0]?.availableDate).toBe(
      '2026-07-26T09:00:00+09:00',
    )
  })

  it('입고창고는 부족분이 난 창고와 같다', () => {
    const result = issue(db(), [line({ warehouseCode: 'WH-02' })])

    expect(result.created[0]?.warehouseCode).toBe('WH-02')
  })

  it('가장 급한 주문을 문서에 되짚어 남긴다', () => {
    const result = issue(db(), [line({ orderIds: ['ORD-URGENT', 'ORD-LATER'] })])

    expect(result.created[0]?.relatedOrderId).toBe('ORD-URGENT')
  })

  /** 문서를 만든 것만으로 현재고는 늘지 않는다 (00_안내) */
  it('발주 생성만으로 현재고는 늘지 않는다', () => {
    const base = db({ inventories: [inventory('PIL-STD', 2)] })
    const result = issue(base, [line()])

    expect(result.created).toHaveLength(1)
    expect(inventoryOf(base.inventories, 'PIL-STD').currentQuantity).toBe(2)
    expect(result.created[0]?.receivedQuantity).toBe(0)
  })

  it('부족수량이 0 이면 문서를 만들지 않는다', () => {
    const result = issue(db(), [line({ shortageQuantity: 0 })])

    expect(result.created).toHaveLength(0)
    expect(result.rejections).toHaveLength(0)
  })

  describe('발주할 수 없는 부족분', () => {
    it.each([
      ['SET-001', 'NOT_ORDERABLE'],
      ['SVC-INSTALL', 'NOT_ORDERABLE'],
      ['UNKNOWN-SKU', 'UNKNOWN_ITEM'],
      ['PAD-STD', 'MISSING_SUPPLIER'],
    ] as const)('%s → %s', (itemCode, code) => {
      const result = issue(db(), [line({ itemCode })])

      expect(result.ok).toBe(false)
      expect(result.created).toHaveLength(0)
      expect(result.rejections[0]?.code).toBe(code)
    })

    it('사용 중지된 창고로는 발주하지 않는다', () => {
      const result = issue(db(), [line({ warehouseCode: 'WH-LEGACY' })])

      expect(result.rejections[0]?.code).toBe('INACTIVE_WAREHOUSE')
    })

    it('만들 수 있는 것만 만들고 나머지는 사유로 남긴다', () => {
      const result = issue(db(), [line({ itemCode: 'PIL-STD' }), line({ itemCode: 'PAD-STD' })])

      expect(result.ok).toBe(true)
      expect(result.created).toHaveLength(1)
      expect(result.rejections).toHaveLength(1)
    })
  })

  describe('중복 요청', () => {
    it('같은 요청 ID 로 다시 발주하면 문서가 늘지 않는다', () => {
      const base = db()
      const first = issue(base, [line()], 'PO-REQ-001')
      const state = {
        ...base,
        incomingDocuments: first.incomingDocuments,
        processedRequests: first.processedRequests,
      }

      const second = issueIncomingDocuments(state, {
        lines: [line()],
        requestId: 'PO-REQ-001',
        orderedAt: BASE_AT,
        makeDocumentId: () => 'PO-DUP',
      })

      expect(second.failure).toBe('DUPLICATE_REQUEST')
      expect(second.incomingDocuments).toHaveLength(1)
    })

    /** 아무것도 못 만들었으면 데이터를 고쳐 같은 요청 ID 로 다시 시도할 수 있어야 한다 */
    it('만든 문서가 없으면 요청을 소진하지 않는다', () => {
      const result = issue(db(), [line({ itemCode: 'PAD-STD' })])

      expect(result.processedRequests).toHaveLength(0)
    })
  })
})
