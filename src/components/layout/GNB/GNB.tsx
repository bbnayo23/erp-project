import { useThemeMode } from '@/app/providers'
import { Badge } from '@/components/common/Badge'
import { IconButton } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { NAVIGATION } from './constants'
import { Bar, Brand, BrandName, Item, Logo, Nav, Right } from './styled'

export function GNB() {
  const { mode, toggleMode } = useThemeMode()

  return (
    <Bar>
      <Brand>
        <Logo>E</Logo>
        <BrandName>ERP</BrandName>
      </Brand>

      <Nav>
        {NAVIGATION.map((item) => (
          <Item key={item.to} to={item.to}>
            <Icon name={item.icon} />
            {item.label}
          </Item>
        ))}
      </Nav>

      <Right>
        <Badge tone="warning" variant="subtle" size="sm">
          IN-MEMORY
        </Badge>
        <IconButton
          aria-label={mode === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
          size="sm"
          onClick={toggleMode}
        >
          <Icon name={mode === 'light' ? 'moon' : 'sun'} />
        </IconButton>
      </Right>
    </Bar>
  )
}
