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

/**
 * 짚어야 할 줄 하나에 붙는 표식.
 *
 * 26줄짜리 목록에서 "이 문서를 보세요" 를 표 전체 강조로는 말할 수 없다. 링은 그
 * 줄들을 감싸기만 하고, 실제로 봐야 하는 줄은 이 표식이 하나씩 가리킨다.
 *
 * 위에서부터 차례로 밝아진다 — 세 줄이 동시에 깜빡이면 어디서부터 읽어야 할지
 * 모른다. 순서가 곧 확인할 순서다.
 */
const markIn = keyframes`
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
`

export const Mark = styled.div<{ $order: number }>`
  position: fixed;
  border-radius: ${({ theme }) => theme.radius.sm};

  /*
   * 링과 같은 색을 쓰되 안쪽으로 그린다 — 줄과 줄 사이가 붙어 있어 밖으로 나가면 겹친다.
   * 면을 칠하지 않는다. 이 표식은 화면 위에 떠 있는 판이라, 배경을 주면 짚으라고 한 그
   * 줄의 내용을 스스로 가린다.
   */
  box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.point};

  animation: ${markIn} ${({ theme }) => theme.motion.surface} both;
  animation-delay: ${({ $order }) => $order * 120}ms;

  ${({ theme }) => theme.reducedMotion} {
    animation: none;
  }
`

/** 표식 왼쪽의 순번 — 확인할 순서를 숫자로도 남긴다 */
export const MarkOrder = styled.span`
  position: absolute;
  top: 50%;
  right: calc(100% + ${({ theme }) => theme.spacing[2]});
  transform: translateY(-50%);

  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.radius.full};

  background: ${({ theme }) => theme.colors.point};
  color: ${({ theme }) => theme.colors.onPoint};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  font-variant-numeric: tabular-nums;
`

/** 대상이 없는(인트로 · 마무리) 스텝 — 화면 전체를 딤 처리만 한다 */
export const Dim = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.overlay};
`

/**
 * 클릭 자리 표시 — 강조한 버튼 가운데에서 한 번 퍼지는 파문.
 *
 * 가이드가 대신 처리하는 스텝에서, 화면이 바뀌기 직전에 어디를 눌렀는지 보여준다.
 * 숫자만 슬쩍 바뀌면 청중은 무엇 때문에 바뀐 것인지 알 수 없다.
 *
 * 실제 클릭을 흉내내지 않고 링만 퍼뜨린다 — 처리는 화면의 버튼이 부르는 것과 같은
 * 스토어 액션으로 하고, 이 애니메이션은 그 자리를 가리키는 역할만 한다.
 */
const ripple = keyframes`
  from { transform: translate(-50%, -50%) scale(0.35); opacity: 0.85; }
  to   { transform: translate(-50%, -50%) scale(1.9);  opacity: 0; }
`

const cursorTap = keyframes`
  0%   { transform: translate(-50%, -50%) scale(1);    opacity: 0; }
  25%  { transform: translate(-50%, -50%) scale(0.72); opacity: 1; }
  60%  { transform: translate(-50%, -50%) scale(1);    opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1.1);  opacity: 0; }
`

export const Press = styled.div`
  position: fixed;
  width: 0;
  height: 0;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    border-radius: ${({ theme }) => theme.radius.full};
  }

  /* 퍼지는 파문 — 버튼 크기와 무관하게 같은 크기로 돈다 */
  &::before {
    width: 96px;
    height: 96px;
    border: 3px solid ${({ theme }) => theme.colors.point};
    animation: ${ripple} 620ms ease-out both;
  }

  /* 눌린 지점 */
  &::after {
    width: 26px;
    height: 26px;
    background: ${({ theme }) => theme.colors.point};
    animation: ${cursorTap} 620ms ease-out both;
  }

  ${({ theme }) => theme.reducedMotion} {
    &::before,
    &::after {
      animation: none;
      opacity: 0;
    }
  }
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

/**
 * 독의 보조 조작(자동 시연 · 처음부터 · 닫기).
 *
 * 공통 Button 의 `ghost` 는 밝은 면에 놓일 것을 전제로 회색 글자를 쓴다. 어두운 독
 * 위에서는 그 회색이 배경에 묻혀 눌 수 있는 것으로 보이지 않는다 — 독이 자기 면에
 * 맞는 색을 입힌다.
 */
export const DockActions = styled(Nav)`
  > button {
    color: ${({ theme }) => theme.colors.focusMuted};
  }

  > button:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.focusBorder};
    color: ${({ theme }) => theme.colors.focusText};
  }
`

export const Hint = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.focusMuted};
  white-space: nowrap;
`

/**
 * 가이드가 대신 처리한 것을 적는 줄.
 *
 * 조용히 처리하면 안 된다. 화면의 숫자가 발표자가 누른 결과인지 가이드가 만든 결과인지
 * 구분되지 않으면, 발표 중에 "지금 이거 제가 누른 건가요" 를 스스로 확인할 수 없다.
 *
 * 색은 독의 어휘를 쓴다. `pointSubtle`(라임 50) 은 흰 면 위에서 쓰도록 만든 톤이라
 * 어두운 독 위에서는 배경과 글자가 둘 다 흐려진다 — 라임은 테두리로만 세우고 글자는
 * 독의 본문색을 그대로 쓴다.
 */
export const Applied = styled.p`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};

  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radius.md};
  border-left: 3px solid ${({ theme }) => theme.colors.point};
  background: ${({ theme }) => theme.colors.focusBorder};

  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.focusText};
`

/** '가이드가 대신 처리' 라는 꼬리표 — 처리 내용(흰 글자)과 층을 나눈다 */
export const AppliedLabel = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};

  color: ${({ theme }) => theme.colors.point};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  white-space: nowrap;
`
