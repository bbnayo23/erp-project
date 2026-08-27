/**
 * 자동화 테스트가 화면을 집는 이름.
 *
 * **먼저 접근성 이름(role + name)으로 집는다.** 버튼은 라벨로, 표는 columnheader 로,
 * 영역은 aria-label 로 찾을 수 있고, 그렇게 쓴 테스트는 스크린리더가 읽는 것과 같은
 * 것을 본다 — 마크업이 바뀌어도 사용자가 보는 것이 그대로면 통과한다.
 *
 * `data-testid` 는 그렇게 집을 수 없는 자리에만 쓴다.
 *   - 상태 표시처럼 접근 가능한 이름이 없는 것 (방금 처리됨 배지)
 *   - 같은 문구가 화면에 여러 번 나와 이름만으로 특정되지 않는 것 (항등식 줄)
 *
 * 여기 모아 두는 이유는 오타를 컴파일 단계에서 잡기 위해서다. 문자열을 화면과 테스트가
 * 각자 적으면 한쪽만 고쳐도 테스트가 조용히 지나간다.
 */
export const TEST_ID = {
  /** 기준시각 · 내 처리 건수 줄 */
  freshness: 'freshness',
  freshnessChanges: 'freshness-changes',

  /** 가용재고 = 현재고 − 예약수량 */
  identityAvailable: 'identity-available',
  /** 현재고 = 보관 + 배정 */
  identitySerial: 'identity-serial',

  /** 방금 처리한 자리 — 품목@창고 키가 붙는다 */
  recent: (key: string) => `recent-${key}`,
} as const
