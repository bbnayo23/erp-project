// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { PreparationPage } from '@/pages/PreparationPage'
import { useErpStore } from '@/store/erpStore'
import { TOUR_STORAGE_KEY } from '@/pages/PreparationPage/constants'
import { planPreparation } from '@/domain/preparation/planPreparation'
import { stageOf } from '@/features/purchase/utils'
import { buildWorkflowGuide } from '@/features/workflow'

/**
 * 화면을 열었을 때 무엇부터 할지 알려주는 가이드.
 *
 * 이 가이드가 지켜야 하는 것은 두 가지다. 첫째, 순서가 업무 사슬을 따라야 한다 —
 * 검사를 통과시켜야 입고할 수 있고, 입고해야 대기 주문이 준비 완료로 바뀐다.
 * 둘째, 카드를 누르면 그 작업 자리로 곧장 가야 한다. 가이드를 읽고 다시 필터를
 * 찾아야 하면 가이드가 일을 줄이는 게 아니라 늘린다.
 */
describe('WorkflowGuide', () => {
  const state = () => useErpStore.getState()

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/orders']}>
        <Routes>
          <Route path="/orders" element={<PreparationPage />} />
          <Route path="/purchase" element={<div>발주 현황 화면</div>} />
        </Routes>
      </MemoryRouter>,
      { wrapper: AppProviders },
    )

  const guide = () => screen.getByRole('region', { name: '오늘 할 일' })

  const stepCard = (label: string) => {
    const found = within(guide())
      .getAllByRole('button')
      .find((button) => (button.textContent ?? '').includes(label))
    if (!found) throw new Error(`${label} 카드를 찾을 수 없다`)
    return found
  }

  const bodyRows = () => {
    const table = screen.getByRole('table')
    return within(table).getAllByRole('row').slice(1)
  }

  const model = () =>
    buildWorkflowGuide({
      plan: planPreparation(state()),
      incomingDocuments: state().incomingDocuments,
      baseAt: state().baseAt,
    })

  beforeEach(() => {
    state().reset()
    // 이 파일은 화면을 검증한다. 첫 방문 안내가 떠 있으면 검증 대상이 딤에 덮인다.
    window.localStorage.setItem(TOUR_STORAGE_KEY, 'done')
  })

  afterEach(() => {
    cleanup()
  })

  it('화면을 열면 무엇부터 할지 먼저 알려준다', () => {
    renderPage()

    const first = model().steps[0]
    if (!first) throw new Error('시드에 할 일이 하나도 없다')

    expect(within(guide()).getByText('오늘 할 일')).toBeInTheDocument()
    expect(screen.getByText(`${first.label}부터 시작하세요`)).toBeInTheDocument()
  })

  /**
   * 사슬 순서가 곧 순서의 근거다. 검사 → 입고 → 예약 → 출고를 거꾸로 하면 같은 목록을
   * 두 번 훑는다 — 입고를 나중에 하면 그때 풀린 주문을 예약하러 다시 돌아와야 한다.
   */
  it('검사 · 입고 · 예약 순서로 늘어놓는다', () => {
    renderPage()

    const orders = model().steps.map((step) => step.order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))

    const ids = model().steps.map((step) => step.id)
    expect(ids.indexOf('INSPECT')).toBeLessThan(ids.indexOf('RECEIVE'))
    expect(ids.indexOf('RECEIVE')).toBeLessThan(ids.indexOf('RESERVE'))
  })

  it('할 일이 없는 단계는 목록에서 뺀다', () => {
    renderPage()

    // 초기 시드에는 예약이 하나도 없어 출고할 것이 없다
    expect(model().steps.some((step) => step.id === 'SHIP')).toBe(false)
    expect(within(guide()).queryByText(/예약분 출고/)).not.toBeInTheDocument()
  })

  it('건수는 도메인 판정과 같다', () => {
    renderPage()

    const inspect = state().incomingDocuments.filter(
      (document) => stageOf(document, state().baseAt) === 'INSPECT',
    ).length

    expect(stepCard('품질검사 통과').textContent).toContain(`${inspect}건`)
  })

  describe('카드를 누르면 그 작업 자리로 간다', () => {
    it('다른 화면의 일이면 이동한다', () => {
      renderPage()

      // 검사와 입고는 발주 현황에서 한다
      fireEvent.click(stepCard('품질검사 통과'))

      expect(screen.getByText('발주 현황 화면')).toBeInTheDocument()
    })

    it('이 화면의 일이면 표를 그 상태로 좁힌다', () => {
      renderPage()

      fireEvent.click(stepCard('부족분 발주'))

      const shortage = planPreparation(state()).entries.filter(
        (entry) => !entry.reserved && entry.preparation.status === 'SHORTAGE',
      ).length

      expect(bodyRows()).toHaveLength(shortage)
    })

    /** 예약 완료 주문은 이미 물량이 확보돼 '예약할 주문' 목록에 남아 있으면 안 된다 */
    it('예약 단계는 예약 완료 주문을 걸러낸다', () => {
      renderPage()

      const entry = planPreparation(state()).entries.find(
        (candidate) => candidate.preparation.status === 'READY',
      )
      if (!entry) throw new Error('시드에 READY 주문이 없다')

      state().reserve(entry.order.orderId)
      cleanup()
      renderPage()

      fireEvent.click(stepCard('준비된 주문 예약'))

      const rows = bodyRows()
      expect(rows).toHaveLength(
        planPreparation(state()).entries.filter(
          (candidate) => !candidate.reserved && candidate.preparation.status === 'READY',
        ).length,
      )
      for (const row of rows) {
        expect(within(row).queryByText('예약 완료')).not.toBeInTheDocument()
      }
    })
  })

  /**
   * 배송일이 임박한 주문은 사슬 순서보다 먼저 봐야 한다.
   * 순서를 지키다 납기를 놓치면 순서가 의미가 없다.
   */
  it('배송일이 임박한 주문은 순서보다 먼저 알린다', () => {
    renderPage()

    const urgent = model().urgent
    if (!urgent) throw new Error('시드에 임박한 주문이 없다')

    expect(
      within(guide()).getByText(new RegExp(`배송일이 임박한 주문 ${urgent.count}건`)),
    ).toBeInTheDocument()
  })
})
