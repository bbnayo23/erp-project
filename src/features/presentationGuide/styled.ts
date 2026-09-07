import styled, { keyframes } from 'styled-components'

/** 클릭이 전부 아래 화면으로 통과해야 한다 — 발표자는 강조된 화면을 실제로 조작한다 */
export const Root = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.guide};
  pointer-events: none;
`

/**
 * 강조 링.
 *
 * box-shadow 한 겹으로 화면 전체를 딤 처리하고 이 자리만 뚫는다. 링 자체에도
 * pointer-events 를 주지 않는다 — 강조된 진짜 버튼을 발표자가 눌러야 하기 때문이다.
 */
export const Ring = styled.div`
  position: fixed;
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow:
    0 0 0 9999px ${({ theme }) => theme.colors.overlay},
    0 0 0 3px ${({ theme }) => theme.colors.point};
`

/** 대상이 없는(인트로 · 마무리) 스텝 — 화면 전체를 딤 처리만 한다 */
export const Dim = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.overlay};
`

const riseIn = keyframes`
  from { opacity: 0; transform: translate(-50%, 8px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
`

/**
 * 진행 안내 카드 — 화면 아래 고정 독. 스텝이 바뀌어도 이 자리는 흔들리지 않는다.
 *
 * 대상을 가리지 않는 몫은 독이 아니라 스크롤이 진다 — 강조할 요소를 이 독의 예약
 * 자리 위쪽으로 스크롤해 넣는다(GuideOverlay 의 scroll-margin 처리). 독 자체가
 * 위·아래로 튀면 발표자가 스텝마다 "가이드가 지금 어디 있지" 를 다시 찾아야 해서,
 * 오히려 화면이 스크롤되는 것보다 더 헷갈린다.
 */
export const Dock = styled.div`
  position: fixed;
  left: 50%;
  bottom: ${({ theme }) => theme.spacing[5]};
  transform: translateX(-50%);
  width: min(640px, calc(100vw - ${({ theme }) => theme.spacing[8]}));
  pointer-events: auto;

  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};

  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.focusSurface};
  color: ${({ theme }) => theme.colors.focusText};
  box-shadow: ${({ theme }) => theme.shadow.lg};

  animation: ${riseIn} ${({ theme }) => theme.motion.surface} both;

  ${({ theme }) => theme.reducedMotion} {
    animation: none;
  }
`

export const Eyebrow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};

  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.focusMuted};
`

export const Progress = styled.span`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`

export const Title = styled.h2`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: ${({ theme }) => theme.font.letterSpacing.tight};
`

export const Body = styled.p`
  font-size: ${({ theme }) => theme.font.size.md};
  line-height: ${({ theme }) => theme.font.lineHeight.relaxed};
  color: ${({ theme }) => theme.colors.focusMuted};
`

export const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  padding-top: ${({ theme }) => theme.spacing[1]};
`

export const Nav = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`

export const Hint = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.focusMuted};
  white-space: nowrap;
`
