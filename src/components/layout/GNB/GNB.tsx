import { useThemeMode } from '@/app/providers'
import { Badge } from '@/components/common/Badge'
import { Button, IconButton } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { useGuideStore } from '@/features/presentationGuide'
import { useErpStore } from '@/store/erpStore'
import { NAVIGATION } from './constants'
import { Bar, Brand, BrandName, Item, Logo, Nav, Right } from './styled'

export const GNB = () => {
  const { mode, toggleMode } = useThemeMode()
  const reset = useErpStore((state) => state.reset)
  const openGuide = useGuideStore((state) => state.open)

  return (
    <Bar>
      <Brand>
        <Logo aria-hidden>E</Logo>
        <BrandName>ERP</BrandName>
      </Brand>

      {/* 화면 안내가 이 값으로 대상을 찾는다 */}
      <Nav data-tour="nav">
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
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Icon name="guide" size={13} />}
          onClick={openGuide}
        >
          가이드
        </Button>
        {/* 백엔드가 없어 새로고침해도 localStorage 에 남는다 — 시드 상태로 되돌리는 길이 필요하다 */}
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Icon name="reset" size={13} />}
          onClick={reset}
        >
          데이터 초기화
        </Button>
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
