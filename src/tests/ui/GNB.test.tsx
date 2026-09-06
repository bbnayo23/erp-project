// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { GNB } from '@/components/layout/GNB'
import { useErpStore } from '@/store/erpStore'

/**
 * 데이터 초기화.
 *
 * 백엔드가 없어 처리 결과가 localStorage 에 쌓인다 (가이드 §4). 화면마다 따로 두지 않고
 * GNB 하나에 두는 이유: 초기화는 특정 화면이 아니라 데이터베이스 전체를 되돌리는
 * 동작이라 화면 전환과 무관하게 항상 같은 자리에 있어야 한다.
 */
describe('GNB', () => {
  const state = () => useErpStore.getState()

  beforeEach(() => {
    state().reset()
  })

  afterEach(() => {
    cleanup()
  })

  const renderGnb = () =>
    render(
      <MemoryRouter>
        <GNB />
      </MemoryRouter>,
      { wrapper: AppProviders },
    )

  it('데이터 초기화 버튼을 누르면 처리 이력이 시드 상태로 돌아간다', () => {
    useErpStore.setState({
      processedRequests: [
        { requestId: 'TEST-001', kind: 'RESERVE', processedAt: state().baseAt },
      ],
    })
    expect(state().processedRequests).toHaveLength(1)

    renderGnb()
    fireEvent.click(screen.getByRole('button', { name: '데이터 초기화' }))

    expect(state().processedRequests).toHaveLength(0)
  })
})
