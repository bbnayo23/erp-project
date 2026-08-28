// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { PreparationPage } from '@/pages/PreparationPage'
import { useErpStore } from '@/store/erpStore'
import { planPreparation } from '@/domain/preparation/planPreparation'

/**
 * 배송 준비 현황 화면의 렌더 확인.
 *
 * 도메인 테스트가 숫자를 지키고, 이 테스트는 그 숫자가 화면까지 오는지를 본다.
 * 특히 usePreparationPlan 의 셀렉터 패턴은 여기서만 검증된다 — 셀렉터 안에서 계획을
 * 계산하면 매 렌더마다 새 객체가 나와 무한히 다시 그린다. 그 실수는 타입도 도메인
 * 테스트도 잡지 못하고, 이 테스트가 멈추지 않는 것으로만 드러난다.
 */
describe('PreparationPage', () => {
  const state = () => useErpStore.getState()

  /**
   * 행을 누르면 상세로 넘어간다. 라우터를 함께 세워 이동한 경로를 확인할 수 있게 한다 —
   * 목록에는 액션 버튼이 없으므로 상세로 가는 길이 유일한 진입점이다.
   */
  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/orders']}>
        <Routes>
          <Route path="/orders" element={<PreparationPage />} />
          <Route path="/orders/:orderId" element={<div>상세 화면</div>} />
        </Routes>
      </MemoryRouter>,
      { wrapper: AppProviders },
    )

  /**
   * 데이터 행만 센다.
   *
   * 표에는 배송일 그룹 머리 줄이 섞여 있다. 그 줄은 th 만 갖고 td 가 없어, td 유무로
   * 가른다 — 인덱스로 자르면 그룹 수가 바뀔 때마다 테스트를 고쳐야 한다.
   */
  const bodyRows = () => {
    const table = screen.getByRole('table')
    return within(table)
      .getAllByRole('row')
      .filter((row) => row.querySelector('td') !== null)
  }

  /** 배송일 그룹 머리 줄 */
  const groupRows = () => {
    const table = screen.getByRole('table')
    return within(table)
      .getAllByRole('row')
      .filter((row) => row.querySelector('th[scope="colgroup"]') !== null)
  }

  beforeEach(() => {
    state().reset()
  })

  afterEach(() => {
    cleanup()
  })

  it('준비 대상 주문이 표에 그려진다', () => {
    renderPage()

    const expected = planPreparation(state()).entries.length

    expect(screen.getByText('주문')).toBeInTheDocument()
    expect(bodyRows()).toHaveLength(expected)
    expect(screen.getByText(`전체 ${expected}건`)).toBeInTheDocument()
  })

  /**
   * 카드는 방금 읽은 숫자다. 그 8건을 보려고 아래 셀렉트를 다시 찾아야 하면
   * 요약이 정보만 주고 일은 안 줄여준다.
   */
  it('요약 카드를 누르면 그 상태만 남고, 다시 누르면 풀린다', () => {
    renderPage()

    const summary = screen.getByRole('list', { name: '준비 상태 요약' })
    const card = within(summary)
      .getAllByRole('button')
      .find((button) => (button.textContent ?? '').includes('발주 필요'))
    if (!card) throw new Error('재고 부족 카드를 찾을 수 없다')

    const shortage = planPreparation(state()).entries.filter(
      (entry) => entry.preparation.status === 'SHORTAGE',
    ).length

    fireEvent.click(card)
    expect(bodyRows()).toHaveLength(shortage)
    expect(card).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(card)
    expect(bodyRows()).toHaveLength(planPreparation(state()).entries.length)
  })

  it('기준시각을 화면에 밝힌다', () => {
    renderPage()

    // 04_재고현황 기준시각 — 어느 시점의 재고를 보고 있는지 알아야 한다
    expect(screen.getByText(/2026\.07\.21 09:00/)).toBeInTheDocument()
  })

  /**
   * 요약 영역을 이름으로 지목한다. '입고 기다림' 같은 라벨은 표의 상태 배지에도 같은
   * 문자열로 나오므로, 화면 전체에서 찾으면 어느 쪽을 본 것인지 알 수 없다.
   */
  it('요약 카드가 상태별 건수를 보여준다', () => {
    renderPage()

    const summary = screen.getByRole('list', { name: '준비 상태 요약' })
    const total = planPreparation(state()).entries.length

    for (const label of [
      '준비 대상 전체',
      '예약할 수 있음',
      '입고 기다림',
      '발주 필요',
      '사람이 볼 것',
    ]) {
      expect(within(summary).getByText(label)).toBeInTheDocument()
    }
    expect(within(summary).getByText(`${total}건`)).toBeInTheDocument()
  })

  it('요약은 필터와 무관하게 전체를 센다', () => {
    renderPage()

    const summary = screen.getByRole('list', { name: '준비 상태 요약' })
    const before = summary.textContent

    fireEvent.change(screen.getByLabelText('준비상태'), { target: { value: 'READY' } })

    // 필터를 걸 때마다 요약이 움직이면 지금 필터가 얼마나 걸러냈는지 알 수 없다
    expect(summary.textContent).toBe(before)
  })

  it('배송예정일이 빠른 주문이 첫 줄에 온다', () => {
    renderPage()

    const plan = planPreparation(state())
    const first = plan.entries[0]
    if (!first) throw new Error('계획이 비어 있다')

    const cells = within(bodyRows()[0] as HTMLElement).getAllByRole('cell')

    expect(cells[0]).toHaveTextContent('1')
    expect(cells[2]).toHaveTextContent(first.order.orderId)
  })

  /**
   * 목록이 26줄이면 '오늘 나갈 것이 몇 건인가' 를 눈으로 세게 된다.
   * 날짜가 바뀌는 자리에 줄을 긋고 건수를 적으면 세지 않아도 된다.
   */
  describe('배송일 그룹', () => {
    it('배송일이 바뀌는 자리마다 머리 줄이 선다', () => {
      renderPage()

      const dates = new Set(
        planPreparation(state()).entries.map((entry) => entry.order.deliveryDate),
      )

      expect(groupRows()).toHaveLength(dates.size)
    })

    it('머리 줄에 그 날짜의 건수를 적는다', () => {
      renderPage()

      const first = groupRows()[0]
      if (!first) throw new Error('그룹 머리 줄이 없다')

      const entries = planPreparation(state()).entries
      const firstDate = entries[0]?.order.deliveryDate
      const count = entries.filter((entry) => entry.order.deliveryDate === firstDate).length

      expect(first).toHaveTextContent(new RegExp(`· ${count}건`))
    })

    /** 목록 순서는 재고를 배정받은 순서다. 그룹으로 묶어도 그 순서가 흐트러지면 안 된다. */
    it('묶어도 배정 순서는 그대로다', () => {
      renderPage()

      const shown = bodyRows().map((row) => row.textContent ?? '')
      const expected = planPreparation(state()).entries.map((entry) => entry.order.orderId)

      for (const [index, orderId] of expected.entries()) {
        expect(shown[index]).toContain(orderId)
      }
    })
  })

  /**
   * 취소·출고완료·배송완료 주문은 새로 준비할 것이 없어 매일 보는 목록만 늘린다.
   * 그러나 '그 주문 어디 갔지' 를 확인할 길은 있어야 한다 — 화면에 아예 없으면
   * 담당자가 데이터를 의심한다.
   */
  describe('제외 주문', () => {
    const excludedIds = () => planPreparation(state()).excluded.map((entry) => entry.order.orderId)

    it('기본으로는 감춘다', () => {
      renderPage()

      const shown = bodyRows()
        .map((row) => row.textContent ?? '')
        .join(' ')

      expect(excludedIds().length).toBeGreaterThan(0)
      for (const orderId of excludedIds()) {
        expect(shown).not.toContain(orderId)
      }
    })

    it('토글을 켜면 목록에 나온다', () => {
      renderPage()

      const before = bodyRows().length
      fireEvent.click(screen.getByLabelText('제외 주문 포함'))

      expect(bodyRows()).toHaveLength(before + excludedIds().length)
    })

    /** 판정 자체가 없는 주문이다. 배지를 달면 처리할 것이 있어 보인다. */
    it('제외 주문에는 준비상태 배지 대신 사유가 적힌다', () => {
      renderPage()
      fireEvent.click(screen.getByLabelText('제외 주문 포함'))

      const orderId = excludedIds()[0]
      const row = bodyRows().find((candidate) => candidate.textContent?.includes(orderId ?? ''))
      if (!row) throw new Error('제외 주문 행을 찾을 수 없다')

      expect(row).toHaveTextContent(/준비 대상 아님/)
    })

    /** 요약과 결과 수는 준비 대상만 센다 — 제외 주문이 섞이면 '오늘 할 일' 이 부풀려진다 */
    it('요약 건수는 제외 주문을 세지 않는다', () => {
      renderPage()
      fireEvent.click(screen.getByLabelText('제외 주문 포함'))

      const targets = planPreparation(state()).entries.length
      const summary = screen.getByRole('list', { name: '준비 상태 요약' })

      expect(within(summary).getByText(`${targets}건`)).toBeInTheDocument()
    })
  })

  describe('필터', () => {
    it('상태를 고르면 그 상태만 남는다', () => {
      renderPage()

      const total = bodyRows().length
      const shortage = planPreparation(state()).entries.filter(
        (entry) => entry.preparation.status === 'SHORTAGE',
      ).length

      fireEvent.change(screen.getByLabelText('준비상태'), { target: { value: 'SHORTAGE' } })

      expect(bodyRows()).toHaveLength(shortage)
      expect(screen.getByText(`${shortage}건 / 전체 ${total}건`)).toBeInTheDocument()
    })

    it('배송일을 고르면 그날 나갈 주문만 남는다', () => {
      renderPage()

      const entries = planPreparation(state()).entries
      const first = entries[0]
      if (!first) throw new Error('계획이 비어 있다')

      const sameDay = entries.filter(
        (entry) => entry.order.deliveryDate === first.order.deliveryDate,
      ).length

      fireEvent.change(screen.getByLabelText('배송예정일'), {
        target: { value: first.order.deliveryDate },
      })

      expect(bodyRows()).toHaveLength(sameDay)
    })

    it('주문번호로 검색한다', () => {
      renderPage()

      const first = planPreparation(state()).entries[0]
      if (!first) throw new Error('계획이 비어 있다')

      fireEvent.change(screen.getByLabelText('주문번호 검색'), {
        target: { value: first.order.orderId },
      })

      expect(bodyRows()).toHaveLength(1)
      expect(screen.getByText(first.order.orderId)).toBeInTheDocument()
    })

    it('조건에 맞는 주문이 없으면 이유를 알려준다', () => {
      renderPage()

      fireEvent.change(screen.getByLabelText('주문번호 검색'), {
        target: { value: 'ORD-존재하지-않음' },
      })

      expect(screen.getByText('조건에 맞는 주문이 없습니다')).toBeInTheDocument()
    })

    it('초기화하면 전체가 돌아온다', () => {
      renderPage()

      const total = bodyRows().length
      fireEvent.change(screen.getByLabelText('준비상태'), { target: { value: 'READY' } })
      fireEvent.click(screen.getAllByText('필터 초기화')[0] as HTMLElement)

      expect(bodyRows()).toHaveLength(total)
    })
  })

  it('행을 누르면 그 주문의 상세로 넘어간다', () => {
    renderPage()

    fireEvent.click(bodyRows()[0] as HTMLElement)

    expect(screen.getByText('상세 화면')).toBeInTheDocument()
  })

  /**
   * 예약한 주문은 배지가 '예약 완료' 로 바뀐다. 준비상태는 여전히 READY 지만 담당자가
   * 할 일이 다르다 — 예약이 아니라 출고다.
   */
  it('예약하면 목록에 예약 완료로 표시된다', () => {
    const entry = planPreparation(state()).entries.find(
      (candidate) => candidate.preparation.status === 'READY',
    )
    if (!entry) throw new Error('시드에 READY 주문이 없다')

    state().reserve(entry.order.orderId)
    renderPage()

    fireEvent.change(screen.getByLabelText('주문번호 검색'), {
      target: { value: entry.order.orderId },
    })

    const row = bodyRows()[0] as HTMLElement

    expect(within(row).getByText('예약 완료')).toBeInTheDocument()
    expect(within(row).getByText(/출고할 수 있습니다/)).toBeInTheDocument()
  })
})
