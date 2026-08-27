// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AppProviders } from '@/app/providers'
import { Select } from '@/components/common/Select'
import { lightTheme } from '@/styles/theme'

/**
 * 셀렉트 스타일 회귀 방지.
 *
 * `appearance: none` 이 빠지면 브라우저가 자기 컨트롤을 그리면서 border-radius · color ·
 * height 를 부분적으로만 반영한다. 같은 코드가 플랫폼마다 다른 모서리와 글자색으로 나오고,
 * 스크린샷을 받아보기 전까지는 아무도 모른다 — 타입도 다른 테스트도 잡지 못한다.
 *
 * 화살표를 직접 그리기로 했으므로 두 가지가 함께 지켜져야 한다.
 * 네이티브 렌더링이 꺼져 있고(그래야 화살표가 하나), 우리 화살표가 있어야 한다(그래야 0개가 아니다).
 */
describe('Select', () => {
  const OPTIONS = [
    { value: 'ALL', label: '전체 창고' },
    { value: 'WH-HQ', label: '본사물류창고' },
  ]

  const renderSelect = (props: Partial<React.ComponentProps<typeof Select>> = {}) =>
    render(<Select aria-label="창고" options={OPTIONS} {...props} />, { wrapper: AppProviders })

  const field = () => screen.getByRole('combobox', { name: '창고' })

  afterEach(() => {
    cleanup()
  })

  it('네이티브 렌더링을 끈다', () => {
    renderSelect()

    const style = window.getComputedStyle(field())
    expect(style.appearance).toBe('none')
    expect(style.getPropertyValue('-webkit-appearance')).toBe('none')
  })

  it('토큰 값이 실제로 적용된다', () => {
    renderSelect()

    const style = window.getComputedStyle(field())
    // 컨트롤 곡률은 카드(radius.xl)와 같은 어휘를 쓴다 — 한 화면에서 곡률이 두 종류면 따로 논다
    expect(style.borderRadius).toBe(lightTheme.radius.lg)
    expect(style.height).toBe(lightTheme.controlHeight.md)
    // 고정 높이 안에서 글자를 수직 중앙에 두려면 body 의 줄높이를 상속받지 않아야 한다
    expect(style.lineHeight).toBe('1')
  })

  /** 네이티브 화살표를 지운 자리에 하나만 있어야 한다 — 0개면 열 수 있는지 알 수 없고, 2개면 겹친다 */
  it('화살표를 하나만 그린다', () => {
    const { container } = renderSelect()

    expect(container.querySelectorAll('svg')).toHaveLength(1)
  })

  /**
   * 감싸는 박스를 두면서 접근성 이름이 래퍼로 새지 않아야 한다.
   * 새면 화면 테스트의 getByLabelText 가 select 가 아닌 span 을 집는다.
   */
  it('접근성 이름은 select 에 붙는다', () => {
    renderSelect()

    expect(field().tagName).toBe('SELECT')
  })

  it('옵션을 그리고 선택이 전달된다', () => {
    const seen: string[] = []
    renderSelect({ value: 'ALL', onChange: (event) => seen.push(event.target.value) })

    expect(screen.getByRole('option', { name: '전체 창고' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '본사물류창고' })).toBeInTheDocument()

    fireEvent.change(field(), { target: { value: 'WH-HQ' } })
    expect(seen).toEqual(['WH-HQ'])
  })

  it('className 은 폭을 잡는 바깥 박스로 간다', () => {
    const { container } = renderSelect({ className: 'probe' })

    const wrapper = container.querySelector('.probe')
    expect(wrapper?.tagName).toBe('SPAN')
    expect(wrapper?.contains(field())).toBe(true)
  })
})
