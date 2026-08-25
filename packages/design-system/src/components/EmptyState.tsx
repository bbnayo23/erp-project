import type { ReactNode } from 'react'
import styled from 'styled-components'

const Root = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[6]};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
`

const IconSlot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  color: ${({ theme }) => theme.colors.textSubtle};
`

const Title = styled.p`
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const Description = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  max-width: 380px;
`

const Actions = styled.div`
  margin-top: ${({ theme }) => theme.spacing[4]};
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`

export interface EmptyStateProps {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <Root className={className}>
      {icon && <IconSlot aria-hidden="true">{icon}</IconSlot>}
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
      {action && <Actions>{action}</Actions>}
    </Root>
  )
}
