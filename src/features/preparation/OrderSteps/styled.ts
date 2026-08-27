import styled, { css, keyframes, type DefaultTheme } from 'styled-components'
import type { OrderStepState } from '@/features/preparation/types'

export const Root = styled.ol`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1]};
  align-items: center;
`

export const Item = styled.li`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
  align-items: center;
`

const stepStyle = (theme: DefaultTheme, state: OrderStepState) =>
  ({
    DONE: css`
      background: ${theme.colors.successSubtle};
      border-color: ${theme.colors.success};
      color: ${theme.colors.successText};
    `,
    /* 지금 할 일만 채운 배경을 준다 — 한 줄에서 눈이 먼저 닿아야 하는 칸이다 */
    CURRENT: css`
      background: ${theme.colors.primary};
      border-color: ${theme.colors.primary};
      color: ${theme.colors.onPrimary};
      font-weight: ${theme.font.weight.semibold};
    `,
    TODO: css`
      background: transparent;
      border-color: ${theme.colors.border};
      color: ${theme.colors.textMuted};
    `,
    /* 이 주문에 필요 없는 칸. 흐리게 두되 지우지는 않는다 — 전체 길이 보여야 한다 */
    SKIPPED: css`
      background: transparent;
      border-color: ${theme.colors.border};
      color: ${theme.colors.textSubtle};
      text-decoration: line-through;
    `,
    BLOCKED: css`
      background: transparent;
      border-color: ${theme.colors.dangerSubtle};
      color: ${theme.colors.textSubtle};
    `,
  })[state]

export const Step = styled.span<{ $state: OrderStepState }>`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing[1]};
  align-items: center;

  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border: ${({ theme }) => theme.borderWidth.thin} solid;
  border-radius: ${({ theme }) => theme.radius.full};

  font-size: ${({ theme }) => theme.font.size.sm};
  white-space: nowrap;

  ${({ theme, $state }) => stepStyle(theme, $state)}
`

export const Arrow = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.colors.textSubtle};
`

const reveal = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: none; }
`

/**
 * '다음 할 일' 줄.
 *
 * 단계 배지만으로는 무엇을 눌러야 하는지가 아직 한 단계 떨어져 있다. 담당자가 상세를
 * 열고 찾는 답을 문장으로 한 번 더 적고, 그 옆에 실제 버튼을 둔다.
 *
 * **이 화면에서 유일하게 어두운 면이다.** 상세에는 카드가 여섯 장 늘어서는데 전부 같은
 * 흰 면이라 어디가 지금 일하는 자리인지 알 수 없었다. 한 장만 어둡게 깔면 눈이 거기서
 * 시작한다. 두 곳을 어둡게 하면 강조가 아니라 무늬가 되므로 여기 하나로 끝낸다.
 */
export const Next = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;

  margin-top: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};

  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.focusSurface};
  color: ${({ theme }) => theme.colors.focusText};

  animation: ${reveal} ${({ theme }) => theme.motion.surface} both;

  ${({ theme }) => theme.reducedMotion} {
    animation: none;
  }
`

export const NextText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

export const NextLabel = styled.strong`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: ${({ theme }) => theme.font.letterSpacing.tight};
`

export const NextHint = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.focusMuted};
`
