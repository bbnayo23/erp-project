// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { AppLayout } from '@/components/layout/AppLayout'
import { PreparationPage } from '@/pages/PreparationPage'
import { PREPARATION_TOUR, TOUR_STORAGE_KEY } from '@/pages/PreparationPage/constants'
import { useErpStore } from '@/store/erpStore'

/**
 * 화면 안내.
 *
 * 정적인 설명 목록이 아니라 순서를 강제하는 조작이다 — 볼 곳에 스포트라이트가 잡히고,
 * 누르면 다음으로 넘어간다. 그래서 이 테스트가 지켜야 하는 것은 세 가지다.
 * 첫 단계가 '먼저 볼 곳'인가, 누르면 다음으로 가는가, 한 번 본 뒤에는 다시 뜨지 않는가.
 */
describe('Tour', () => {
  const state = () => useErpStore.getState()

  /**
   * 앱 셸까지 세운다.
   *
   * 마지막 단계가 가리키는 메뉴는 GNB 에 있어 페이지 밖이다. 페이지만 렌더하면 그 대상이
   * 없어서, 실제로는 다섯 단계인 안내가 네 단계로만 검증된다.
   */
  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/orders']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="orders" element={<PreparationPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { wrapper: AppProviders },
    )

  const tour = () => screen.getByRole('dialog', { name: '배송 준비 현황 안내' })
  const noTour = () => screen.queryByRole('dialog', { name: '배송 준비 현황 안내' })
  /** 어디를 눌러도 다음으로 — 이 안내의 핵심 조작 */
  const scrim = () => {
    const found = document.querySelector<HTMLElement>('[data-tour-scrim]')
    if (!found) throw new Error('안내 클릭 판을 찾을 수 없다')
    return found
  }

  beforeEach(() => {
    state().reset()
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('처음 열면 안내가 자동으로 뜬다', () => {
    renderPage()

    expect(tour()).toBeInTheDocument()
  })

  /** 첫 단계는 반드시 '먼저 볼 곳'이어야 한다 — 그게 이 안내의 존재 이유다 */
  it('첫 단계가 오늘 할 일을 가리킨다', () => {
    renderPage()

    expect(PREPARATION_TOUR[0]?.target).toBe('workflow')
    expect(screen.getByText('여기부터 보세요')).toBeInTheDocument()
    expect(screen.getByText(`1 / ${PREPARATION_TOUR.length}`)).toBeInTheDocument()
  })

  it('안내 대상이 화면에 모두 있다', () => {
    renderPage()

    for (const step of PREPARATION_TOUR) {
      expect(document.querySelector(`[data-tour="${step.target}"]`)).not.toBeNull()
    }
  })

  describe('클릭하면 다음으로 넘어간다', () => {
    it('판을 누르면 다음 단계', () => {
      renderPage()

      fireEvent.click(scrim())
      expect(screen.getByText('숫자를 누르면 걸러집니다')).toBeInTheDocument()
      expect(screen.getByText(`2 / ${PREPARATION_TOUR.length}`)).toBeInTheDocument()

      fireEvent.click(scrim())
      expect(screen.getByText('준비상태와 예약 여부는 다른 축입니다')).toBeInTheDocument()
    })

    it('다음 버튼도 같은 일을 한다', () => {
      renderPage()

      fireEvent.click(screen.getByRole('button', { name: '다음' }))
      expect(screen.getByText(`2 / ${PREPARATION_TOUR.length}`)).toBeInTheDocument()
    })

    /** 첫 단계에는 이전이 없다 — 누를 수 없는 버튼을 남기지 않는다 */
    it('이전은 두 번째 단계부터 나온다', () => {
      renderPage()

      expect(screen.queryByRole('button', { name: '이전' })).not.toBeInTheDocument()

      fireEvent.click(scrim())
      fireEvent.click(screen.getByRole('button', { name: '이전' }))
      expect(screen.getByText('여기부터 보세요')).toBeInTheDocument()
    })

    it('마지막 단계를 지나면 닫힌다', () => {
      renderPage()

      for (let i = 0; i < PREPARATION_TOUR.length - 1; i += 1) fireEvent.click(scrim())

      // 마지막 단계에서는 버튼 문구가 바뀐다 — 다음이 없다는 것을 말해야 한다
      expect(
        screen.getByText(`${PREPARATION_TOUR.length} / ${PREPARATION_TOUR.length}`),
      ).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: '안내 닫기' }))

      expect(noTour()).not.toBeInTheDocument()
    })
  })

  describe('빠져나갈 길', () => {
    it('건너뛰기로 닫는다', () => {
      renderPage()

      fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }))
      expect(noTour()).not.toBeInTheDocument()
    })

    it('Esc 로 닫는다', () => {
      renderPage()

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(noTour()).not.toBeInTheDocument()
    })

    it('방향키로도 넘긴다', () => {
      renderPage()

      fireEvent.keyDown(document, { key: 'ArrowRight' })
      expect(screen.getByText(`2 / ${PREPARATION_TOUR.length}`)).toBeInTheDocument()

      fireEvent.keyDown(document, { key: 'ArrowLeft' })
      expect(screen.getByText(`1 / ${PREPARATION_TOUR.length}`)).toBeInTheDocument()
    })
  })

  /** 매번 뜨면 안내가 방해가 된다 */
  it('한 번 본 뒤에는 자동으로 뜨지 않는다', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }))
    cleanup()

    renderPage()
    expect(noTour()).not.toBeInTheDocument()
    expect(window.localStorage.getItem(TOUR_STORAGE_KEY)).toBe('done')
  })

  it('머리말 버튼으로 다시 볼 수 있다', () => {
    window.localStorage.setItem(TOUR_STORAGE_KEY, 'done')
    renderPage()

    expect(noTour()).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '화면 안내' }))
    expect(tour()).toBeInTheDocument()
    expect(screen.getByText('여기부터 보세요')).toBeInTheDocument()
  })

  /**
   * 스토리지를 못 읽는 환경(프라이빗 모드 등)에서는 자동으로 띄우지 않는다.
   * 매번 뜨는 쪽이 한 번도 안 뜨는 쪽보다 나쁘다.
   */
  it('스토리지가 막혀 있으면 자동으로 띄우지 않는다', () => {
    // jsdom 의 localStorage 는 Proxy 라 인스턴스에 메서드를 덮어쓰면 저장 항목이 된다.
    // 프로토타입을 가로채야 실제로 던지게 만들 수 있다.
    const blocked = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    try {
      renderPage()
      expect(noTour()).not.toBeInTheDocument()
    } finally {
      blocked.mockRestore()
    }
  })
})
