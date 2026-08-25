import type { ReactNode } from 'react'
import styled from 'styled-components'

const Root = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
  flex-wrap: wrap;
`

const Title = styled.h2`
  font-size: ${({ theme }) => theme.font.size['2xl']};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const Description = styled.p`
  margin-top: 2px;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`

export interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Root>
      <div>
        <Title>{title}</Title>
        {description && <Description>{description}</Description>}
      </div>
      {actions && <Actions>{actions}</Actions>}
    </Root>
  )
}

export const FilterBar = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-wrap: wrap;
  padding: ${({ theme }) => theme.spacing[4]};
  border-bottom: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme }) => theme.colors.border};
`

export const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.dangerSubtle};
  color: ${({ theme }) => theme.colors.dangerText};
  font-size: ${({ theme }) => theme.font.size.sm};
  border-bottom: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme }) => theme.colors.border};
`
