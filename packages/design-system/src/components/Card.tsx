import type { ReactNode } from 'react'
import styled, { css } from 'styled-components'

export interface CardProps {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  elevation?: 'none' | 'xs' | 'sm' | 'md'
  interactive?: boolean
}

export const Card = styled.div<CardProps>`
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme, elevation = 'xs' }) => theme.shadow[elevation]};
  overflow: hidden;

  ${({ theme, padding = 'md' }) => {
    if (padding === 'none') return null
    const map = { sm: theme.spacing[3], md: theme.spacing[5], lg: theme.spacing[6] }
    return css`
      padding: ${map[padding]};
    `
  }}

  ${({ interactive, theme }) =>
    interactive &&
    css`
      cursor: pointer;
      transition:
        border-color ${theme.duration.fast} ${theme.easing.standard},
        box-shadow ${theme.duration.fast} ${theme.easing.standard},
        transform ${theme.duration.fast} ${theme.easing.standard};

      &:hover {
        border-color: ${theme.colors.borderStrong};
        box-shadow: ${theme.shadow.md};
      }

      &:active {
        transform: translateY(1px);
      }
    `}
`

const HeaderRoot = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  border-bottom: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme }) => theme.colors.border};
`

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

const Title = styled.h3`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const Description = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

export interface CardHeaderProps {
  title: ReactNode
  description?: ReactNode
  /** 우측 액션 영역 (버튼 등) */
  actions?: ReactNode
}

export function CardHeader({ title, description, actions }: CardHeaderProps) {
  return (
    <HeaderRoot>
      <TitleGroup>
        <Title>{title}</Title>
        {description && <Description>{description}</Description>}
      </TitleGroup>
      {actions}
    </HeaderRoot>
  )
}

export const CardBody = styled.div<{ padding?: 'none' | 'sm' | 'md' | 'lg' }>`
  ${({ theme, padding = 'md' }) => {
    if (padding === 'none') return null
    const map = { sm: theme.spacing[3], md: theme.spacing[5], lg: theme.spacing[6] }
    return css`
      padding: ${map[padding]};
    `
  }}
`

export const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  border-top: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceMuted};
`
