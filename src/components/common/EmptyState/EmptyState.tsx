import { Actions, Description, Root, Title } from './styled'
import type { EmptyStateProps } from './types'

export const EmptyState = ({ title, description, action, className }: EmptyStateProps) => {
  return (
    <Root className={className}>
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
      {action && <Actions>{action}</Actions>}
    </Root>
  )
}
