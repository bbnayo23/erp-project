import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyDemoStage,
  currentDemoStage,
  DEMO_ORDER,
  pendingDemoStages,
} from '@/features/presentationGuide/demo'
import { GUIDE_STEPS } from '@/features/presentationGuide/steps'
import { findPlanEntry, planPreparation } from '@/domain/preparation/planPreparation'
import { rowTourOf, toIncomingRow } from '@/features/purchase/utils'
import { useErpStore } from '@/store/erpStore'

/**
 * 발표 가이드의 시연 상태.
 *
 * 가이드는 "결과를 보여주는 화면" 을 그 결과가 이미 만들어진 상태로 띄운다 — 입고 이력은
 * 입고를 해야 한 줄이 생기고, 배정된 개체 표는 예약을 해야 채워지므로, 발표자가 아무것도
 * 누르지 않으면 설명하는 화면이 비어 있다.
 *
 * 그래서 이 테스트가 확인하는 것은 카드 문구가 아니라 **각 단계가 실제로 그 상태를
 * 만드는가** 다. 시연이 화면의 버튼과 다른 길로 재고를 바꾸면 발표에서 보여준 숫자가
 * 업무 규칙의 결과가 아니게 된다.
 */
describe('발표 가이드 · 시연 상태', () => {
  const state = () => useErpStore.getState()
  const orderStatus = () => state().orders.find((o) => o.orderId === DEMO_ORDER)?.status
  const preparationStatus = () =>
    findPlanEntry(planPreparation(state()), DEMO_ORDER)?.preparation.status

  beforeEach(() => {
    state().reset()
  })

  describe('단계별로 화면이 성립하는 상태를 만든다', () => {
    it('시드에서는 예시 주문이 재고 부족이다', () => {
      expect(currentDemoStage(state())).toBe('SEED')
      expect(preparationStatus()).toBe('SHORTAGE')
    })

    it('발주 생성 — 문서가 만들어지고 현재고는 그대로다', () => {
      const before = state().inventories
      applyDemoStage('ISSUED')

      const issued = state().incomingDocuments.filter(
        (document) => document.relatedOrderId === DEMO_ORDER,
      )
      expect(issued.length).toBeGreaterThan(0)
      expect(state().inventories).toEqual(before)
    })

    it('생산의뢰 — 검사를 기록하고 합격분을 입고해 현재고가 는다', () => {
      applyDemoStage('PRODUCTION_RECEIVED')

      const production = state().incomingDocuments.find(
        (document) => document.documentId === 'MO-20260721-Z10',
      )
      expect(production?.inspectionStatus).toBe('검사 완료')
      expect(production?.receivedQuantity).toBe(2)
    })

    it('구매발주 입고 — 잔여가 0이 되고 주문이 바로 준비 가능으로 풀린다', () => {
      applyDemoStage('PURCHASE_RECEIVED')

      const purchase = state().incomingDocuments.find(
        (document) => document.documentId === 'PO-20260719-DMN',
      )
      expect(purchase?.receivedQuantity).toBe(purchase?.plannedQuantity)
      expect(preparationStatus()).toBe('READY')
    })

    it('입고 이력이 남아 발주 현황 화면이 비어 있지 않다', () => {
      applyDemoStage('PURCHASE_RECEIVED')

      const received = state().stockMovements.filter((movement) => movement.kind === 'RECEIVE')
      expect(received.length).toBeGreaterThanOrEqual(3)
    })

    it('예약 — 개체가 배정되고 현재고는 그대로다', () => {
      applyDemoStage('PURCHASE_RECEIVED')
      const stockBefore = state().inventories.map((inventory) => inventory.currentQuantity)

      applyDemoStage('RESERVED')

      expect(state().reservations.some((r) => r.orderId === DEMO_ORDER)).toBe(true)
      expect(state().serials.some((serial) => serial.reservedOrderId === DEMO_ORDER)).toBe(true)
      expect(state().inventories.map((inventory) => inventory.currentQuantity)).toEqual(stockBefore)
    })

    it('출고 — 주문이 출고 완료가 되고 준비 대상에서 빠진다', () => {
      applyDemoStage('SHIPPED')

      expect(orderStatus()).toBe('출고 완료')
      expect(findPlanEntry(planPreparation(state()), DEMO_ORDER)).toBeUndefined()
    })
  })

  describe('리허설로 몇 번을 오가도 같은 화면이 나온다', () => {
    it('앞 단계로 돌아가면 시드로 되돌린 뒤 그 단계까지 다시 만든다', () => {
      applyDemoStage('SHIPPED')
      expect(orderStatus()).toBe('출고 완료')

      // 부족 판정 화면(슬라이드 7)으로 되돌아간 경우
      applyDemoStage('SEED')
      expect(currentDemoStage(state())).toBe('SEED')
      expect(preparationStatus()).toBe('SHORTAGE')

      // 다시 앞으로 — 출고 완료된 주문은 예약할 수 없으므로, 되돌리지 않으면 여기서 막힌다
      applyDemoStage('RESERVED')
      expect(state().reservations.some((r) => r.orderId === DEMO_ORDER)).toBe(true)
    })

    it('같은 단계를 다시 실행해도 아무것도 바뀌지 않는다', () => {
      applyDemoStage('PURCHASE_RECEIVED')
      const snapshot = {
        inventories: state().inventories,
        incomingDocuments: state().incomingDocuments,
        stockMovements: state().stockMovements,
      }

      expect(applyDemoStage('PURCHASE_RECEIVED')).toEqual([])
      expect(state().inventories).toEqual(snapshot.inventories)
      expect(state().incomingDocuments).toEqual(snapshot.incomingDocuments)
      expect(state().stockMovements).toEqual(snapshot.stockMovements)
    })

    it('바뀔 것이 없는 단계는 처리한 목록이 비어 있다 — 클릭 표시를 띄우지 않는 근거다', () => {
      expect(pendingDemoStages('SEED')).toEqual([])
      expect(pendingDemoStages('RESERVED')).toEqual([
        'ISSUED',
        'PRODUCTION_RECEIVED',
        'PURCHASE_RECEIVED',
        'RESERVED',
      ])
    })
  })

  describe('짚는 자리가 실제로 있는가', () => {
    /**
     * 행 단위 앵커는 표에 그 성격의 줄이 없으면 아무것도 강조하지 못한다.
     *
     * 딤만 깔린 화면에 카드만 떠 있게 되므로, 발표에서 가장 티가 나는 실패다. 시드가
     * 바뀌어 어느 단계가 비면 여기서 잡힌다.
     */
    it('발주 현황에서 짚는 단계마다 시드에 문서가 있다', () => {
      applyDemoStage('ISSUED')

      const state = useErpStore.getState()
      const rows = state.incomingDocuments.map((document) =>
        toIncomingRow(document, state.items, state.warehouses, state.suppliers, state.baseAt),
      )

      const rowSelectors = GUIDE_STEPS.flatMap((step) =>
        step.selector?.startsWith('purchase.row') ? [step.selector] : [],
      )
      expect(rowSelectors.length).toBeGreaterThan(0)

      for (const selector of rowSelectors) {
        const matched = rows.filter((row) => rowTourOf(row).split(' ').includes(selector))
        expect(matched.length, `${selector} 에 걸리는 문서가 없다`).toBeGreaterThan(0)
      }
    })
  })

  describe('스텝 선언', () => {
    it('클릭 표시는 강조가 실제 버튼인 자리에만 붙는다', () => {
      const pressTargets = GUIDE_STEPS.filter((step) => step.press).map((step) => step.selector)

      expect(pressTargets).toEqual([
        'issue.submit',
        'receive.submit',
        'receive.submit',
        'order.nextAction',
        'order.nextAction',
      ])
      // 누를 자리가 없는데 눌리는 시늉을 하면 청중이 화면 어딘가를 찾는다
      expect(GUIDE_STEPS.every((step) => !step.press || step.demo)).toBe(true)
    })

    it('시연 단계는 발표 순서를 거스르지 않는다', () => {
      const order = [
        'SEED',
        'ISSUED',
        'PRODUCTION_RECEIVED',
        'PURCHASE_RECEIVED',
        'RESERVED',
        'SHIPPED',
      ]
      const declared = GUIDE_STEPS.flatMap((step) => (step.demo ? [order.indexOf(step.demo)] : []))

      expect(declared).toEqual([...declared].sort((a, b) => a - b))
    })
  })
})
