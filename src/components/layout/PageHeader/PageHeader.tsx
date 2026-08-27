import { Actions, Description, Root, Title, TitleGroup } from './styled'
import type { PageHeaderProps } from './types'

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Root>
      <TitleGroup>
        <Title>{title}</Title>
        {description && <Description>{description}</Description>}
      </TitleGroup>
      {actions && <Actions>{actions}</Actions>}
    </Root>
  )
}
