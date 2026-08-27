import styled, { keyframes } from 'styled-components'

/**
 * 오른쪽 화면 밖에서 왼쪽으로 밀려 들어온다.
 *
 * 시작점이 `+100%` 인 것은 자기 너비만큼 오른쪽, 즉 화면 밖이라는 뜻이다.
 */
const slideInFromRight = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`

export const Panel = styled.aside<{ $width?: string }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  /*
   * 넓혀도 화면을 다 먹지는 않는다. 딤이 남아 있어야 뒤 목록이 보이고, 그게 모달이
   * 아니라 드로어를 쓰는 이유다 — 표에서 한 건씩 훑어보는 화면이다.
   */
  max-width: min(${({ theme, $width }) => $width ?? theme.layout.drawerWidth}, 92vw);
  height: 100%;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.lg};
  /*
   * fill-mode 가 없으면 첫 프레임이 제자리에 그려진 뒤 시작점으로 튄다 — 패널이 한 번
   * 깜빡였다가 들어오는 것처럼 보인다. 애니메이션 시작 전부터 시작 상태를 유지시킨다.
   */
  animation: ${slideInFromRight} ${({ theme }) => theme.duration.normal}
    ${({ theme }) => theme.easing.entrance} both;

  ${({ theme }) => theme.reducedMotion} {
    animation: none;
  }
`

export const Header = styled.header`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[4]};
  flex-shrink: 0;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-bottom: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme }) => theme.colors.border};
`

export const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`

export const Title = styled.h2`
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text};
`

export const Description = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing[4]};
`

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-shrink: 0;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-top: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceMuted};
`
