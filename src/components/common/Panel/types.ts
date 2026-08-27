import type { ReactNode } from 'react'

/**
 * 구획이 서는 방식.
 *
 * 카드를 전부 없애지도, 전부 두르지도 않는다. 기준은 **그 구획이 페이지에서 홀로
 * 서는가** 다.
 *
 * - `card` — 페이지 바로 아래에 놓이는 구획. 테두리로 자기 영역을 밝힌다.
 * - `plain` — 이미 카드 안에 들어 있는 구획. 카드 속의 카드는 어느 면이 위인지 판단을
 *   요구하고 모서리마다 여백을 만든다. 선 하나로 나눈다.
 * - `focus` — 어두운 면. 화면에서 지금 일하는 자리 한 곳에만 쓴다.
 */
export type PanelTone = 'card' | 'plain' | 'focus'

export interface PanelProps {
  tone?: PanelTone
  /**
   * 위쪽 구분선을 긋는다 (기본 true, `plain` 에서만 쓰인다).
   *
   * 카드 안의 첫 구획처럼 나눌 것이 없는 자리에서 끈다 — 나누는 것이 없는 가로선은
   * 경계가 아니라 장식이다.
   */
  divided?: boolean
  /**
   * 카드 머리말.
   *
   * 화면이 \`<h2>\` 를 직접 그리지 않는다. 페이지마다 제목 스타일을 따로 두면 좌우 여백이
   * 갈려 어떤 카드는 글자가 테두리에 붙는다 — 실제로 그렇게 갈라져 있었다.
   */
  title?: ReactNode
  /** 제목 아래 한 줄 — 이 카드의 숫자를 어떻게 읽어야 하는지 */
  description?: ReactNode
  /** 머리말 오른쪽 — 이 카드에만 걸리는 액션 */
  actions?: ReactNode

  /** 표 위에 얹히는 필터 줄 */
  filter?: ReactNode

  /**
   * 표가 아닌 내용에 좌우 여백을 준다.
   *
   * 기본값이 false 인 이유: 이 카드의 주 내용은 표이고, 표는 카드 끝까지 채워야
   * 행 구분선이 카드 테두리와 만난다. 여백을 기본으로 주면 표마다 그것을 다시
   * 지워야 한다.
   */
  padded?: boolean

  children?: ReactNode
  className?: string
}
