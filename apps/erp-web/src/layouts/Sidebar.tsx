import { NavLink } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { useUiStore } from '@/stores/uiStore'
import { NAVIGATION } from './navigation'

const Aside = styled.aside<{ $collapsed: boolean }>`
  position: sticky;
  top: 0;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: ${({ theme, $collapsed }) =>
    $collapsed ? theme.layout.sidebarCollapsedWidth : theme.layout.sidebarWidth};
  background: ${({ theme }) => theme.colors.surface};
  border-right: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.border};
  transition: width ${({ theme }) => theme.duration.normal} ${({ theme }) => theme.easing.standard};
  overflow: hidden;
`

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  height: ${({ theme }) => theme.layout.headerHeight};
  padding-inline: ${({ theme }) => theme.spacing[4]};
  border-bottom: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`

const Logo = styled.div`
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  font-size: ${({ theme }) => theme.font.size.sm};
`

const BrandName = styled.span<{ $hidden: boolean }>`
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  font-size: ${({ theme }) => theme.font.size.lg};
  white-space: nowrap;
  opacity: ${({ $hidden }) => ($hidden ? 0 : 1)};
  transition: opacity ${({ theme }) => theme.duration.fast};
`

const Nav = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[2]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`

const GroupTitle = styled.p<{ $hidden: boolean }>`
  padding-inline: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: ${({ theme }) => theme.font.letterSpacing.wide};
  color: ${({ theme }) => theme.colors.textSubtle};
  text-transform: uppercase;
  white-space: nowrap;
  opacity: ${({ $hidden }) => ($hidden ? 0 : 1)};
`

const Item = styled(NavLink)<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  height: 40px;
  padding-inline: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  white-space: nowrap;
  transition:
    background-color ${({ theme }) => theme.duration.fast},
    color ${({ theme }) => theme.duration.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
    color: ${({ theme }) => theme.colors.text};
    text-decoration: none;
  }

  &.active {
    background: ${({ theme }) => theme.colors.primarySubtle};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.font.weight.semibold};
  }

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      justify-content: center;
      padding-inline: 0;
    `}
`

const ItemLabel = styled.span<{ $hidden: boolean }>`
  opacity: ${({ $hidden }) => ($hidden ? 0 : 1)};
  transition: opacity ${({ theme }) => theme.duration.fast};
`

export function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)

  return (
    <Aside $collapsed={collapsed}>
      <Brand>
        <Logo>E</Logo>
        <BrandName $hidden={collapsed}>ERP</BrandName>
      </Brand>

      <Nav>
        {NAVIGATION.map((group) => (
          <div key={group.title}>
            <GroupTitle $hidden={collapsed}>{group.title}</GroupTitle>
            {group.items.map((item) => (
              <Item
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                $collapsed={collapsed}
                title={collapsed ? item.label : undefined}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={item.icon} />
                </svg>
                <ItemLabel $hidden={collapsed}>{item.label}</ItemLabel>
              </Item>
            ))}
          </div>
        ))}
      </Nav>
    </Aside>
  )
}
