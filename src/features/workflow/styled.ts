import styled, { css, type DefaultTheme } from 'styled-components'
import type { BadgeTone } from '@/components/common/Badge'

/**
 * 가이드는 남색 지면 위에 앉는다.
 *
 * 아래 표·카드가 모두 흰 표면이라 같은 흰 카드를 하나 더 얹으면 '먼저 볼 것' 이라는
 * 신호가 서지 않는다. 지면을 반전시켜 화면에서 단 하나만 다르게 보이게 한다.
 * 라임 포인트도 이 지면 위에서만 제 대비가 나온다.
 */
export const Root = styled.section`
  position: relative;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) =>
    theme.mode === 'dark' ? theme.colors.surfaceMuted : theme.palette.navy[600]};
  color: ${({ theme }) => (theme.mode === 'dark' ? theme.colors.text : theme.palette.white)};
  border: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme }) => (theme.mode === 'dark' ? theme.colors.border : theme.palette.navy[700])};
`

export const Head = styled.header`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
  flex-wrap: wrap;
  padding: ${({ theme }) => theme.spacing[5]} ${({ theme }) => theme.spacing[5]}
    ${({ theme }) => theme.spacing[4]};
`

export const HeadTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

/** 포인트 색을 쓰는 단 한 곳 — '지금 할 일' 이라는 사실 자체를 표시한다 */
export const PointTag = styled.span`
  padding: 2px ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.xs};
  background: ${({ theme }) => theme.colors.point};
  color: ${({ theme }) => theme.colors.onPoint};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  letter-spacing: ${({ theme }) => theme.font.letterSpacing.wide};
  white-space: nowrap;
`

export const HeadNote = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  opacity: 0.78;
`

/** 배송일이 임박한 주문 — 사슬 순서보다 먼저 봐야 한다 */
export const Urgent = styled.p`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-inline: ${({ theme }) => theme.spacing[5]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: rgba(240, 68, 56, 0.18);
  border: ${({ theme }) => theme.borderWidth.thin} solid rgba(253, 162, 155, 0.45);
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`

export const Steps = styled.ol`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: ${({ theme }) => theme.spacing[3]};
  padding: 0 ${({ theme }) => theme.spacing[5]} ${({ theme }) => theme.spacing[5]};
  list-style: none;
`

export const StepItem = styled.li`
  display: flex;
`

const dotColor = (theme: DefaultTheme, tone: BadgeTone): string =>
  ({
    neutral: theme.palette.slate[300],
    primary: theme.palette.navy[200],
    point: theme.colors.point,
    success: theme.palette.green[300],
    warning: theme.palette.amber[300],
    danger: theme.palette.red[300],
    info: theme.palette.violet[300],
  })[tone]

/**
 * 단계 카드. 첫 단계만 포인트 테두리를 받는다 —
 * 여섯 개가 모두 강조되면 어느 것부터 할지 다시 알 수 없다.
 */
export const StepButton = styled.button<{ $first: boolean; $tone: BadgeTone }>`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radius.md};
  text-align: left;
  color: inherit;
  background: rgba(255, 255, 255, 0.07);
  border: ${({ theme }) => theme.borderWidth.thin} solid rgba(255, 255, 255, 0.14);
  transition:
    background-color ${({ theme }) => theme.duration.fast},
    border-color ${({ theme }) => theme.duration.fast};

  ${({ $first, theme }) =>
    $first &&
    css`
      background: rgba(255, 255, 255, 0.13);
      border-color: ${theme.colors.point};
    `}

  &:hover {
    background: rgba(255, 255, 255, 0.18);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.point};
    outline-offset: 2px;
  }
`

export const StepTop = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
`

/** 사슬 번호. 순서에 근거가 있다는 것을 숫자로 말한다. */
export const StepNo = styled.span<{ $tone: BadgeTone }>`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme, $tone }) => dotColor(theme, $tone)};
  color: ${({ theme }) => theme.palette.navy[800]};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  font-variant-numeric: tabular-nums;
`

export const StepLabel = styled.span`
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  flex: 1;
  min-width: 0;
`

export const StepCount = styled.span`
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`

export const StepWhy = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  line-height: ${({ theme }) => theme.font.lineHeight.snug};
  opacity: 0.74;
`

export const StepWhere = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  opacity: 0.9;
`

/** 남은 작업이 없을 때 */
export const Clear = styled.p`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: 0 ${({ theme }) => theme.spacing[5]} ${({ theme }) => theme.spacing[5]};
  font-size: ${({ theme }) => theme.font.size.md};
  opacity: 0.85;
`
