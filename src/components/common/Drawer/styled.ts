import styled, { keyframes } from 'styled-components'

const slideInRight = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`

export const Panel = styled.aside<{ $width?: string }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: ${({ theme, $width }) => $width ?? theme.layout.drawerWidth};
  height: 100%;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.lg};
  animation: ${slideInRight} ${({ theme }) => theme.duration.normal}
    ${({ theme }) => theme.easing.entrance};
`

export const Header = styled.header`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[4]};
  flex-shrink: 0;
  padding: ${({ theme }) => theme.spacing[5]} ${({ theme }) => theme.spacing[6]};
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
  padding: ${({ theme }) => theme.spacing[6]};
`

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-shrink: 0;
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  border-top: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceMuted};
`
