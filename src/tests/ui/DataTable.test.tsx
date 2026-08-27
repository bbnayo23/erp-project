// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { AppProviders } from '@/app/providers'
import { DataTable } from '@/components/common/DataTable'

/**
 * 고정 머리 줄이 스크롤에도 남아야 한다.
 *
 * 표에는 `border-collapse: collapse` 가 걸려 있다(GlobalStyle). 이때 테두리는 셀이 아니라
 * 표의 것이 되어, 머리 줄이 sticky 로 떠 있는 동안 따라오지 않고 스크롤에 밀려 사라진다 —
 * 회색 띠만 덩그러니 남는다. 스크롤해 봐야 드러나는 종류라 눈으로는 놓친다.
 */
describe('DataTable 고정 머리 줄', () => {
  const rows = [{ name: '가' }, { name: '나' }]

  const renderTable = (sticky: boolean) =>
    render(
      <DataTable
        columns={[{ key: 'name', header: '이름' }]}
        data={rows}
        rowKey={(row) => row.name}
        stickyHeader={sticky}
      />,
      { wrapper: AppProviders },
    )

  afterEach(() => {
    cleanup()
  })

  it('머리 줄의 위아래 선을 border 가 아니라 inset 그림자로 그린다', () => {
    renderTable(true)

    const style = getComputedStyle(screen.getByRole('columnheader'))

    expect(style.boxShadow).toContain('inset')
    // 위아래 두 줄 — 아래만 있으면 바로 위 필터 줄과 붙어 표의 시작이 흐려진다
    expect(style.boxShadow.match(/inset/g)).toHaveLength(2)

    for (const side of ['borderTopStyle', 'borderBottomStyle'] as const) {
      expect(style[side]).toBe('none')
    }
  })

  it('머리 줄은 본문 행보다 위에 뜬다', () => {
    renderTable(true)

    const head = getComputedStyle(screen.getByRole('columnheader'))

    expect(head.position).toBe('sticky')
    // 떠 있는 줄에 배경이 없으면 스크롤한 행이 글자 사이로 비친다
    expect(head.backgroundColor).not.toBe('')
    expect(head.backgroundColor).not.toBe('transparent')
    expect(Number(head.zIndex)).toBeGreaterThan(0)
  })

  it('고정하지 않으면 뜨지 않는다', () => {
    renderTable(false)

    expect(getComputedStyle(screen.getByRole('columnheader')).position).toBe('static')
  })
})
