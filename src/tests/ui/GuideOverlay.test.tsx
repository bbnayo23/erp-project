// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useRoutes } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { ROUTES } from '@/app/routes'
import { GUIDE_STEPS } from '@/features/presentationGuide/steps'
import { useGuideStore } from '@/features/presentationGuide/store'
import { useErpStore } from '@/store/erpStore'
import { TEST_ID } from '../testIds'

/**
 * 발표 가이드가 결과 화면을 채워 놓는지.
 *
 * 가이드의 뒤쪽 절반은 "처리 결과" 를 설명하는 화면이다 — 입고 이력, 배정된 개체,
 * 출고 후 재고 이력. 그 처리를 하지 않은 채로 도착하면 설명하는 자리가 비어 있어,
 * 발표자가 카드를 읽는 동안 청중은 빈 표를 본다.
 *
 * 그래서 확인하는 것은 카드 문구가 아니라 **화면에 결과가 실제로 그려지는가** 다.
 */
describe('발표 가이드 오버레이', () => {
  const stepIndex = (id: string) => GUIDE_STEPS.findIndex((step) => step.id === id)

  /**
   * 앱을 그대로 세운다. 가이드는 스텝마다 실제로 라우팅하므로 라우터 없이는 확인할 수 없다.
   *
   * 브라우저 · 메모리 데이터 라우터는 jsdom 에서 못 쓴다 — 이동할 때 내부적으로 Request 를
   * 만들어 undici 의 AbortSignal 검사에 걸린다. `useRoutes` 로 같은 route 정의를 그대로
   * 태우면 데이터 라우터를 거치지 않는다.
   */
  const AppRoutes = () => useRoutes(ROUTES)

  const renderApp = () =>
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
      { wrapper: AppProviders },
    )

  const openAt = (id: string) => {
    useGuideStore.setState({ index: stepIndex(id), isOpen: true, autoDemo: true })
    return renderApp()
  }

  beforeEach(() => {
    useErpStore.getState().reset()
  })

  afterEach(() => {
    cleanup()
    useGuideStore.setState({ isOpen: false, index: 0, autoDemo: true })
  })

  it('발주 현황 스텝에 도착하면 발주 문서가 이미 만들어져 있다', async () => {
    openAt('s9-2')

    await waitFor(
      () => {
        expect(
          useErpStore
            .getState()
            .incomingDocuments.some(
              (document) => document.relatedOrderId === 'ORD202607210029',
            ),
        ).toBe(true)
      },
      { timeout: 5000 },
    )

    // 출처 주문이 붙은 문서가 목록에 실제로 그려진다
    await waitFor(() => {
      expect(screen.getAllByText(/ORD202607210029/).length).toBeGreaterThan(0)
    })
  })

  it('입고 이력 스텝에 도착하면 이력이 채워져 있다', async () => {
    openAt('s12-1')

    await waitFor(
      () => {
        expect(
          useErpStore.getState().stockMovements.filter((m) => m.kind === 'RECEIVE').length,
        ).toBeGreaterThanOrEqual(3)
      },
      { timeout: 5000 },
    )

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: '입고 후 현재고' })).toBeInTheDocument()
    })
  })

  it('배정된 개체 스텝에 도착하면 예약이 끝나 개체가 배정되어 있다', async () => {
    openAt('s13-4')

    await waitFor(
      () => {
        const state = useErpStore.getState()
        expect(state.reservations.some((r) => r.orderId === 'ORD202607210029')).toBe(true)
        expect(state.serials.some((s) => s.reservedOrderId === 'ORD202607210029')).toBe(true)
      },
      { timeout: 5000 },
    )
  })

  it('출고 스텝은 누를 자리를 먼저 보여준 뒤 처리한다', async () => {
    openAt('s13-5')

    // 강조 → 클릭 표시 → 결과. 표시가 먼저 떠야 화면이 왜 바뀌는지 볼 수 있다.
    await waitFor(() => {
      expect(screen.getByTestId(TEST_ID.guidePress)).toBeInTheDocument()
    })

    await waitFor(
      () => {
        expect(
          useErpStore.getState().orders.find((o) => o.orderId === 'ORD202607210029')?.status,
        ).toBe('출고 완료')
      },
      { timeout: 5000 },
    )
  })

  it('발주 현황에서 봐야 하는 줄들을 순번과 함께 짚는다', async () => {
    openAt('s9-3') // ① 먼저 볼 것 — 검사 대기

    const marks = await waitFor(
      () => {
        const found = screen.getAllByTestId(TEST_ID.guideMark)
        expect(found.length).toBeGreaterThan(1)
        return found
      },
      { timeout: 5000 },
    )

    // 순번이 곧 확인할 순서다 — 여러 줄이 동시에 깜빡이면 어디서부터 읽을지 모른다
    expect(marks.map((mark) => mark.textContent)).toEqual(
      marks.map((_, index) => String(index + 1)),
    )

    // 화면 밖으로 밀린 줄이 있어도 개수는 독에서 읽힌다
    expect(screen.getByRole('dialog', { name: '발표 가이드' })).toHaveTextContent(
      `볼 곳 ${marks.length}`,
    )
  })

  it('짚을 줄이 하나면 표식 없이 링만 씌운다', async () => {
    openAt('s9-2') // 방금 들어온 데이터 — 출처 주문이 붙은 문서 한 건

    await waitFor(
      () => {
        expect(
          useErpStore
            .getState()
            .incomingDocuments.filter((d) => d.relatedOrderId === 'ORD202607210029'),
        ).toHaveLength(1)
      },
      { timeout: 5000 },
    )

    expect(screen.queryAllByTestId(TEST_ID.guideMark)).toHaveLength(0)
  })

  it('가이드가 대신 처리한 것을 독에 적는다', async () => {
    openAt('s12-1')

    await waitFor(
      () => {
        expect(screen.getByRole('status')).toHaveTextContent('가이드가 대신 처리')
      },
      { timeout: 5000 },
    )
  })

  it('자동 시연을 끄면 재고를 건드리지 않는다', async () => {
    useGuideStore.setState({ index: stepIndex('s12-1'), isOpen: true, autoDemo: false })
    renderApp()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '자동 시연 켜기' })).toBeInTheDocument()
    })

    expect(useErpStore.getState().stockMovements).toHaveLength(0)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
