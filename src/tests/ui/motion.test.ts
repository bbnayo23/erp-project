import { globSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * 애니메이션은 transform 과 opacity 만 움직인다.
 *
 * 두 속성은 합성 단계에서만 처리되어 레이아웃과 페인트를 다시 돌리지 않는다. width ·
 * height · top · box-shadow 를 전이하면 프레임마다 그 둘이 다시 돌아, 26줄짜리 표가
 * 떠 있는 화면에서 마우스를 훑기만 해도 프레임이 떨어진다.
 *
 * 예외는 없다. 눈으로 지킬 수 없는 규칙이라 스타일 소스를 직접 본다. 새 컴포넌트에
 * `transition: box-shadow …` 를 적으면 여기서 걸린다.
 */
describe('애니메이션 속성', () => {
  const STYLE_FILES = globSync('src/**/styled.ts')

  /** 합성 단계에서 끝나지 않는 속성 — 전이 대상으로 쓰면 안 된다 */
  const EXPENSIVE = [
    'width',
    'height',
    'top',
    'left',
    'right',
    'bottom',
    'margin',
    'padding',
    'box-shadow',
  ]

  it('스타일 파일을 찾는다', () => {
    expect(STYLE_FILES.length).toBeGreaterThan(10)
  })

  it.each(STYLE_FILES)('%s 는 비싼 속성을 전이하지 않는다', (path) => {
    const source = readFileSync(path, 'utf8')

    // `transition: X …` 의 X 만 본다. 값 안의 단어(예: cubic-bezier)는 대상이 아니다
    const targets = [...source.matchAll(/transition:\s*([^;]+);/g)].flatMap((match) =>
      (match[1] ?? '')
        .split(',')
        .map((part) => part.trim().split(/\s+/)[0] ?? '')
        .filter(Boolean),
    )

    const offenders = targets.filter((target) =>
      EXPENSIVE.some((property) => target === property || target.startsWith(`${property}-`)),
    )

    expect(offenders).toEqual([])
  })

  /**
   * 움직임을 원하지 않는 사용자.
   *
   * 전역에서 한 번 끈다. `animation-duration: 0.01ms` 는 키프레임을 즉시 끝내므로
   * `both` 로 채운 시작 상태(opacity: 0)에 갇히지 않는다 — 컴포넌트마다 다시 끄지
   * 않아도 되는 이유다. 이 규칙이 사라지면 앱 전체의 움직임을 끌 길이 없어진다.
   */
  it('전역에서 움직임을 끌 수 있다', () => {
    const global = readFileSync('src/styles/GlobalStyle.ts', 'utf8')

    expect(global).toContain('prefers-reduced-motion: reduce')
    expect(global).toContain('animation-duration: 0.01ms !important')
    expect(global).toContain('transition-duration: 0.01ms !important')
  })
})
