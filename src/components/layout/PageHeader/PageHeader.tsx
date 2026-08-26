import { Actions, Description, Root, Title } from './styled'
import type { PageHeaderProps } from './types'

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
