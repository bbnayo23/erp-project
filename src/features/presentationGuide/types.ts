export interface GuideStep {
  /** 고유 키 — 목차 점프나 디버깅에 쓴다 */
  id: string
  /** 발표대본의 슬라이드 번호(1~16) — 진행률 표시에 쓴다 */
  slide: number
  /** 슬라이드 이름 — 화면 전환 시 안내 카드 위에 적는다 */
  slideLabel: string
  /** 이동할 라우트. 없으면 지금 화면에 그대로 머문다 */
  path?: string
  /**
   * 하이라이트할 자리 — `[data-tour="값"]` 로 찾는다.
   * 없으면 화면 가운데 안내 카드만 뜬다(인트로 · 마무리 슬라이드).
   */
  selector?: string
  /** 카드 제목 — 대본의 번호 포인트 */
  title: string
  /** 카드 본문 — 그 포인트에서 짚어야 할 한두 문장 */
  body: string
}
