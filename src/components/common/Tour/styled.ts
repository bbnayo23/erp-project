import styled, { css, keyframes } from 'styled-components'
import type { TargetRect } from './types'

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

/**
 * 클릭을 받는 판. 어디를 눌러도 다음 단계로 간다.
 *
 * 안내 중에는 화면을 조작하지 못하게 막는다 — 안내를 따라가면서 동시에 버튼을 누르면
 * 방금 설명한 화면이 이미 바뀌어 있다.
 */
export const Scrim = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.popover};
  cursor: pointer;
  animation: ${fadeIn} ${({ theme }) => theme.duration.fast} ${({ theme }) => theme.easing.entrance};
`

/**
 * 스포트라이트. 대상 자리에 구멍을 낸 것처럼 보이게 한다.
 *
 * 사방에 딤 사각형 네 개를 두는 대신 거대한 box-shadow 하나로 바깥을 덮는다 —
 * 모서리를 둥글게 유지할 수 있고, 위치가 바뀔 때 네 값이 어긋날 일이 없다.
 */
export const Spotlight = styled.div<{ $rect: TargetRect }>`
  position: fixed;
  z-index: ${({ theme }) => theme.zIndex.popover};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow:
    0 0 0 9999px ${({ theme }) => theme.colors.overlay},
    0 0 0 3px ${({ theme }) => theme.colors.point};
  /* 클릭은 Scrim 이 받는다 */
  pointer-events: none;
  transition:
    top ${({ theme }) => theme.duration.normal} ${({ theme }) => theme.easing.standard},
    left ${({ theme }) => theme.duration.normal} ${({ theme }) => theme.easing.standard},
    width ${({ theme }) => theme.duration.normal} ${({ theme }) => theme.easing.standard},
    height ${({ theme }) => theme.duration.normal} ${({ theme }) => theme.easing.standard};

  ${({ $rect }) => css`
    top: ${$rect.top - 8}px;
    left: ${$rect.left - 8}px;
    width: ${$rect.width + 16}px;
    height: ${$rect.height + 16}px;
  `}
`

/** 설명 말풍선 */
export const Callout = styled.div<{ $top: number; $left: number }>`
  position: fixed;
  z-index: ${({ theme }) => theme.zIndex.popover};
  width: min(360px, calc(100vw - ${({ theme }) => theme.spacing[8]}));
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[5]};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadow.lg};
  animation: ${fadeIn} ${({ theme }) => theme.duration.fast} ${({ theme }) => theme.easing.entrance};

  ${({ $top, $left }) => css`
    top: ${$top}px;
    left: ${$left}px;
  `}
`

export const Counter = styled.p`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: ${({ theme }) => theme.font.letterSpacing.wide};
  color: ${({ theme }) => theme.colors.textSubtle};
  font-variant-numeric: tabular-nums;
`

/** 진행 표시 — 몇 걸음 남았는지 보여야 끝까지 본다 */
export const Track = styled.span`
  display: flex;
  gap: 3px;
  flex: 1;
`

export const Tick = styled.span<{ $done: boolean }>`
  flex: 1;
  height: 3px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme, $done }) => ($done ? theme.colors.point : theme.colors.border)};
`

export const Title = styled.h2`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text};
`

export const Body = styled.p`
  font-size: ${({ theme }) => theme.font.size.md};
  line-height: ${({ theme }) => theme.font.lineHeight.normal};
  color: ${({ theme }) => theme.colors.textMuted};
`

/** 이 단계에서 특히 짚을 한 줄 — 포인트 색 밑선을 받는 유일한 자리 */
export const Hint = styled.p`
  align-self: flex-start;
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.xs};
  background: ${({ theme }) => theme.colors.point};
  color: ${({ theme }) => theme.colors.onPoint};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding-top: ${({ theme }) => theme.spacing[1]};
`

export const Spacer = styled.div`
  flex: 1;
`
