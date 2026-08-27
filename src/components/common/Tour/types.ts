/**
 * 화면 안내 한 단계.
 *
 * 대상을 ref 로 넘기지 않고 `data-tour` 값으로 찾는다. 안내는 화면 여러 겹에 걸쳐 있어
 * ref 를 쓰면 페이지에서 표·카드·메뉴까지 ref 를 꿰어 내려야 하고, 그 배선이 안내와
 * 무관한 컴포넌트의 props 를 오염시킨다.
 */
export interface TourStep {
  /**
   * 대상 요소의 `data-tour` 값.
   *
   * **항상 화면에 있는 영역이어야 한다.** 안내가 열리는 첫 렌더에서는 페이지가 아직
   * 커밋되지 않아 대상을 찾을 수 없으므로, 단계 목록은 조건 없이 신뢰한다. 조건부로
   * 사라지는 영역은 단계로 두지 않는다 — 넘길 때는 없는 대상을 건너뛰지만, 첫 단계가
   * 없으면 스포트라이트 없이 설명만 뜬다.
   */
  target: string
  title: string
  body: string
  /** 이 단계에서 특히 짚을 한 줄. 없으면 생략한다. */
  hint?: string
}

export interface TourProps {
  steps: TourStep[]
  /** 끝까지 봤거나 건너뛰었을 때 */
  onClose: () => void
  /** 스크린리더가 이 안내를 가리킬 이름 */
  label: string
}

/** 대상 요소의 화면상 위치. 측정 전이거나 대상이 없으면 null. */
export interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}
