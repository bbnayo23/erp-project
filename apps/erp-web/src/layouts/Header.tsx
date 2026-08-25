import { useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, IconButton, Text } from '@erp/design-system'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { NAVIGATION } from './navigation'

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.header};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  height: ${({ theme }) => theme.layout.headerHeight};
  padding-inline: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme }) => theme.colors.border};
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const Right = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`

const UserChip = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding-left: ${({ theme }) => theme.spacing[3]};
  border-left: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.border};
`

const Avatar = styled.div`
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primarySubtle};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
    <path
      d="M4 7h16M4 12h16M4 17h16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
)

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
    <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-13a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1Zm0 14a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM4 12a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm14 0a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1ZM6.3 6.3a1 1 0 0 1 1.4 0l.7.7a1 1 0 0 1-1.4 1.4l-.7-.7a1 1 0 0 1 0-1.4Zm9.3 9.3a1 1 0 0 1 1.4 0l.7.7a1 1 0 0 1-1.4 1.4l-.7-.7a1 1 0 0 1 0-1.4Zm2.1-9.3a1 1 0 0 1 0 1.4l-.7.7a1 1 0 0 1-1.4-1.4l.7-.7a1 1 0 0 1 1.4 0ZM8.4 15.6a1 1 0 0 1 0 1.4l-.7.7a1 1 0 0 1-1.4-1.4l.7-.7a1 1 0 0 1 1.4 0Z" />
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
    <path d="M21 13.2A9 9 0 1 1 10.8 3a7 7 0 0 0 10.2 10.2Z" />
  </svg>
)

/** 현재 경로에 해당하는 메뉴명을 찾아 헤더 타이틀로 쓴다 */
function useCurrentTitle(): string {
  const { pathname } = useLocation()
  const flat = NAVIGATION.flatMap((group) => group.items)
  const matched = flat
    .filter((item) => (item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)))
    .sort((a, b) => b.to.length - a.to.length)[0]
  return matched?.label ?? 'ERP'
}

export function Header() {
  const title = useCurrentTitle()
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const themeMode = useUiStore((state) => state.themeMode)
  const toggleTheme = useUiStore((state) => state.toggleTheme)
  const user = useAuthStore((state) => state.user)

  return (
    <Bar>
      <IconButton aria-label="사이드바 접기/펼치기" size="sm" onClick={toggleSidebar}>
        <MenuIcon />
      </IconButton>

      <Title>{title}</Title>
      <Badge tone="warning" variant="subtle" size="sm">
        MOCK
      </Badge>

      <Right>
        <IconButton
          aria-label={themeMode === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
          size="sm"
          onClick={toggleTheme}
        >
          {themeMode === 'light' ? <MoonIcon /> : <SunIcon />}
        </IconButton>

        <UserChip>
          <Avatar>{user?.name?.slice(0, 1) ?? '?'}</Avatar>
          <div>
            <Text variant="bodyStrong" style={{ display: 'block' }}>
              {user?.name ?? '로그인 필요'}
            </Text>
            <Text variant="caption" color="textSubtle">
              {user?.department ?? '-'}
            </Text>
          </div>
        </UserChip>
      </Right>
    </Bar>
  )
}
