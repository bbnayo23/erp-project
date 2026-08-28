import { beforeEach, describe, expect, it } from 'vitest'
import { useErpStore } from '@/store/erpStore'
import { planPreparation } from '@/domain/preparation/planPreparation'
import { getRemainingQuantity } from '@/domain/purchase/getRemainingQuantity'

/**
 * 발주 확정과 품질검사 결과.
 *
 * 두 처리 모두 **재고를 움직이지 않는다.** 확정은 '이 물량을 판정에 세어도 된다' 는
 * 선언이고, 검사는 '이 중 얼마가 쓸 수 있는 물건인가' 를 가른다. 물건이 창고에 들어오는
 * 것은 입고 처리 하나뿐이다.
 */
describe('발주 확정 · 품질검사', () => {
  const state = () => useErpStore.getState()

  const draft = () => {
    const document = state().incomingDocuments.find((candidate) => !candidate.confirmed)
    if (!document) throw new Error('시드에 미확정 문서가 없다')
    return document
  }

  const pending = () => {
    const document = state().incomingDocuments.find(
      (candidate) => candidate.confirmed && candidate.inspectionStatus === '검사 대기',
    )
    if (!document) throw new Error('시드에 검사 대기 문서가 없다')
    return document
  }

  beforeEach(() => {
    state().reset()
  })

  describe('확정', () => {
    it('확정해도 현재고는 늘지 않는다', () => {
      const before = JSON.stringify(state().inventories)

      expect(state().confirm(draft().documentId).ok).toBe(true)

      expect(JSON.stringify(state().inventories)).toBe(before)
    })

    it('구매는 발주 확정, 생산은 진행 중이 된다', () => {
      const document = draft()
      state().confirm(document.documentId)

      const after = state().incomingDocuments.find(
        (candidate) => candidate.documentId === document.documentId,
      )
      expect(after?.confirmed).toBe(true)
      expect(after?.status).toBe(document.documentType === '구매' ? '발주 확정' : '진행 중')
    })

    /**
     * 확정 전에는 판정에 쓰이지 않는다 — 도착을 기대할 근거가 없기 때문이다.
     *
     * 다만 시드의 미확정 두 건은 확정해도 어떤 주문의 **상태를 뒤집지는 않는다.**
     * 날짜 제약(사용가능예정일 <= 배송일 − 1일) 때문이다.
     *   PO-20260721-PIL  07-23 도착 → PIL-ZERO 를 기다리는 07-22 · 07-23 주문은 못 쓴다
     *   PO-20260721-FRMK 07-25 도착 → FRM-DMN-K 를 쓰는 주문은 이미 준비 가능하다
     * 그래서 '상태가 바뀐다' 가 아니라 '입고예정으로 세어진다' 를 확인한다.
     */
    it('확정하면 그 물량이 입고예정으로 세어진다', () => {
      const document = draft()

      const incomingFor = () =>
        planPreparation(state())
          .entries.filter((entry) => entry.order.warehouseCode === document.warehouseCode)
          .flatMap((entry) => entry.preparation.items)
          .filter((item) => item.itemCode === document.itemCode)
          .reduce((total, item) => total + item.incomingQuantity, 0)

      const before = incomingFor()
      state().confirm(document.documentId)

      expect(incomingFor()).toBeGreaterThan(before)
    })

    it('이미 확정된 문서는 다시 확정하지 않는다', () => {
      const document = draft()
      state().confirm(document.documentId)

      const outcome = state().confirm(document.documentId)
      expect(outcome.ok).toBe(false)
      expect(outcome.code).toBe('ALREADY_CONFIRMED')
    })
  })

  describe('품질검사', () => {
    it('전량 합격이면 계획수량이 그대로다', () => {
      const document = pending()

      expect(state().inspect(document.documentId).ok).toBe(true)

      const after = state().incomingDocuments.find(
        (candidate) => candidate.documentId === document.documentId,
      )
      expect(after?.plannedQuantity).toBe(document.plannedQuantity)
      expect(after?.inspectionStatus).toBe('검사 완료')
    })

    /**
     * 불합격분은 앞으로도 들어오지 않는다. 계획수량을 그대로 두면 잔여가 남아,
     * 담당자가 오지 않을 물량을 계속 기다린다.
     */
    it('불합격 수량만큼 계획수량이 줄어든다', () => {
      const document = pending()
      const remaining = getRemainingQuantity(document)

      expect(
        state().inspect(document.documentId, {
          passedQuantity: remaining - 1,
          failedQuantity: 1,
          note: '포장 파손',
        }).ok,
      ).toBe(true)

      const after = state().incomingDocuments.find(
        (candidate) => candidate.documentId === document.documentId,
      )
      expect(after?.plannedQuantity).toBe(document.plannedQuantity - 1)
      expect(after?.inspectionNote).toBe('포장 파손')
    })

    it('전량 불합격이면 잔여가 0이 되어 더 받을 것이 없다', () => {
      const document = pending()
      const remaining = getRemainingQuantity(document)

      state().inspect(document.documentId, { passedQuantity: 0, failedQuantity: remaining })

      const after = state().incomingDocuments.find(
        (candidate) => candidate.documentId === document.documentId,
      )!
      expect(getRemainingQuantity(after)).toBe(0)
    })

    it('합격 + 불합격이 남은 수량과 다르면 거부한다', () => {
      const document = pending()

      const outcome = state().inspect(document.documentId, {
        passedQuantity: 999,
        failedQuantity: 0,
      })
      expect(outcome.ok).toBe(false)
      expect(outcome.code).toBe('QUANTITY_MISMATCH')
    })

    it('검사 기록만으로는 현재고가 늘지 않는다', () => {
      const before = JSON.stringify(state().inventories)

      state().inspect(pending().documentId)

      expect(JSON.stringify(state().inventories)).toBe(before)
    })
  })
})
