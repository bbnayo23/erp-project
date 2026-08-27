import { css, keyframes } from 'styled-components'

/**
 * 화면 공통 움직임.
 *
 * 규칙은 하나다 — **transform 과 opacity 만 움직인다.** 두 속성은 합성 단계에서만
 * 처리되어 레이아웃과 페인트를 다시 돌리지 않는다. width · height · top · box-shadow 를
 * 전이하면 26줄짜리 표가 떠 있는 화면에서 프레임이 떨어진다.
 *
 * 지속 시간도 짧게 잡는다. ERP 화면은 하루에 수백 번 오가는 곳이라 0.3초가 넘는
 * 전환은 두 번째부터 방해가 된다.
 */

const enter = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
`

/**
 * 페이지가 들어올 때.
 *
 * 라우트가 바뀌면 페이지 컴포넌트가 새로 마운트되므로 키프레임이 자동으로 한 번 돈다 —
 * 전환을 감지하는 상태나 라이브러리가 필요 없다.
 *
 * 자식에게 따로 걸지 않는다. 카드 여섯 장이 각자 올라오면 화면이 한 번에 정리되지
 * 않아 어디를 봐야 할지 알 수 없다. 면 하나가 통째로 들어오고, 그 안에서 KPI 카드만
 * 자기 리듬으로 뜬다.
 */
export const pageEnter = css`
  animation: ${enter} ${({ theme }) => theme.motion.surface} both;

  ${({ theme }) => theme.reducedMotion} {
    animation: none;
  }
`

/**
 * 눌리는 면의 반응.
 *
 * 그림자를 전이하지 않는다 — 그림자는 페인트를 다시 돌린다. 떠오르는 느낌은 translateY
 * 로 내고, 그림자가 필요하면 미리 그려둔 가상 요소의 opacity 를 바꾼다.
 */
export const pressable = css`
  transition: transform ${({ theme }) => theme.motion.hover};

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  ${({ theme }) => theme.reducedMotion} {
    transition: none;

    &:active:not(:disabled) {
      transform: none;
    }
  }
`
