// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { AppProviders } from '@/app/providers'
import { DataTable } from '@/components/common/DataTable'
import { Panel } from '@/components/common/Panel'
import { lightTheme } from '@/styles/theme'

/**
 * 구획의 기준선은 한 곳에서만 정해져야 한다.
 *
 * 카드 테두리를 걷어낸 화면에서 구획을 잡아주는 것은 **세로 기준선** 하나다. 제목이
 * 표의 첫 글자와 다른 선에서 시작하면 구획 전체가 삐뚤어 보인다. 눈으로만 확인하면
 * 화면이 늘 때마다 다시 갈라지므로 계산된 여백을 직접 본다.
 */
describe('Panel', () => {
  const wrap = (ui: React.ReactNode) => render(<>{ui}</>, { wrapper: AppProviders })

  /** 제목 · 표 첫 글자가 함께 서야 하는 세로선 */
  const GUTTER = lightTheme.tableCell.paddingX

  const paddingOf = (element: Element) => {
    const style = getComputedStyle(element)
    return {
      top: style.paddingTop,
      right: style.paddingRight,
      bottom: style.paddingBottom,
      left: style.paddingLeft,
    }
  }

  afterEach(() => {
    cleanup()
  })

  it('제목이 표와 같은 세로선에서 시작한다', () => {
    wrap(
      <Panel title="재고 이력" description="예약 · 출고 · 입고가 어느 칸을 움직였는지">
        <DataTable
          columns={[{ key: 'name', header: '이름' }]}
          data={[{ name: '가' }]}
          rowKey={(row) => row.name}
        />
      </Panel>,
    )

    const head = screen.getByRole('heading', { name: '재고 이력' }).closest('div')?.parentElement
    if (!head) throw new Error('머리말을 찾을 수 없다')

    const cell = screen.getByRole('cell')

    expect(paddingOf(head).left).toBe(GUTTER)
    expect(paddingOf(head).right).toBe(GUTTER)
    // 표 셀과 같은 값이어야 두 글자가 같은 선에 선다
    expect(paddingOf(cell).left).toBe(GUTTER)
  })

  /**
   * 표는 자기 셀에 여백이 있다. 구획이 여백을 또 주면 첫 글자가 제목보다 안쪽으로 밀린다.
   */
  it('표는 구획 여백을 한 번 더 받지 않는다', () => {
    const { container } = wrap(
      <Panel title="입고 이력">
        <DataTable
          columns={[{ key: 'name', header: '이름' }]}
          data={[{ name: '가' }]}
          rowKey={(row) => row.name}
        />
      </Panel>,
    )

    const section = container.querySelector('section')
    if (!section) throw new Error('구획을 찾을 수 없다')

    // 표를 감싼 래퍼가 따로 없어야 한다 — Body 가 끼면 여백이 두 번 붙는다
    expect(screen.getByRole('table').closest('section')).toBe(section)
    // jsdom 은 지정되지 않은 패딩을 '0' 으로 돌려준다
    expect(paddingOf(section).left).toMatch(/^0(px)?$/)
  })

  it('표가 아닌 내용도 같은 세로선에서 시작한다', () => {
    wrap(
      <Panel title="처리 단계" padded>
        <p>단계</p>
      </Panel>,
    )

    const body = screen.getByText('단계').parentElement
    if (!body) throw new Error('본문을 찾을 수 없다')

    const padding = paddingOf(body)
    expect(padding.left).toBe(GUTTER)
    expect(padding.right).toBe(GUTTER)
    // 위쪽은 머리말이 이미 냈다 — 두 번 주면 제목이 내용에서 멀어진다
    expect(padding.top).toBe('0px')
  })

  /**
   * 페이지 바로 아래에 놓이는 구획은 카드다. 테두리가 없으면 표가 어디서 시작해 어디서
   * 끝나는지 배경만으로는 알 수 없다.
   */
  it('홀로 서는 구획은 테두리를 두른다', () => {
    const { container } = wrap(
      <Panel title="재고 현황">
        <p>내용</p>
      </Panel>,
    )

    const section = container.querySelector('section')
    if (!section) throw new Error('구획을 찾을 수 없다')

    const style = getComputedStyle(section)
    for (const side of ['borderTopStyle', 'borderBottomStyle', 'borderLeftStyle'] as const) {
      expect(style[side]).toBe('solid')
    }
    expect(style.borderRadius).toBe(lightTheme.radius.xl)
  })

  /**
   * 이미 카드 안에 있는 구획은 테두리가 아니라 위쪽 선 하나로 나눈다. 카드 속의 카드는
   * 어느 면이 위인지 판단을 요구하고, 모서리마다 여백이 생겨 격자가 흐트러진다.
   *
   * 폭이 아니라 style 을 본다 — jsdom 은 지정되지 않은 테두리 폭에 엉뚱한 값을 돌려준다.
   */
  it('카드 안의 구획은 위쪽 선 하나로 나눈다', () => {
    const { container } = wrap(
      <>
        <Panel tone="plain" title="첫 구획">
          <p>가</p>
        </Panel>
        <Panel tone="plain" title="둘째 구획">
          <p>나</p>
        </Panel>
      </>,
    )

    const [first, second] = [...container.querySelectorAll('section')]
    if (!first || !second) throw new Error('구획을 찾을 수 없다')

    // 맨 위의 가로선은 나누는 것이 없어 장식이 된다
    expect(getComputedStyle(first).borderTopStyle).toBe('none')
    expect(getComputedStyle(second).borderTopStyle).toBe('solid')

    // 테두리로 둘러싸지 않는다
    for (const side of ['borderBottomStyle', 'borderLeftStyle', 'borderRightStyle'] as const) {
      expect(getComputedStyle(second)[side]).toBe('none')
    }
  })

  it('나눌 것이 없는 자리에서는 선을 끌 수 있다', () => {
    const { container } = wrap(
      <>
        <Panel tone="plain" title="가">
          <p>가</p>
        </Panel>
        <Panel tone="plain" title="나" divided={false}>
          <p>나</p>
        </Panel>
      </>,
    )

    const second = [...container.querySelectorAll('section')][1]
    if (!second) throw new Error('구획을 찾을 수 없다')

    expect(getComputedStyle(second).borderTopStyle).toBe('none')
  })
})
