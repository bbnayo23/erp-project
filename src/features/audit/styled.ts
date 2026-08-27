import styled, { keyframes } from 'styled-components'

export const Root = styled.p`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;
  flex-wrap: wrap;

  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Stamp = styled.span`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing[1]};
  align-items: center;
  white-space: nowrap;
`

export const Separator = styled.span`
  color: ${({ theme }) => theme.colors.textDisabled};
`

/**
 * 내가 처리한 내역.
 *
 * 스냅샷 표시보다 진하게 둔다 — 담당자가 확인하려는 것은 '엑셀이 언제 것인가' 가
 * 아니라 '내 조작이 반영됐는가' 다.
 */
export const Change = styled.span`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing[1]};
  align-items: center;

  color: ${({ theme }) => theme.colors.text};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
`

/** 살아 있는 값임을 알리는 점. 화면에 하나뿐이라 시선을 뺏지 않는다. */
export const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.success};

  animation: ${pulse} 2.4s ease-in-out infinite;

  ${({ theme }) => theme.reducedMotion} {
    animation: none;
  }
`
