import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

export const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.header};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[6]};
  height: ${({ theme }) => theme.layout.gnbHeight};
  padding-inline: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme }) => theme.colors.border};
`

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-shrink: 0;
`

/**
 * 로고 마크. 브랜드 남색 위에 포인트 색으로 밑선을 둔다 —
 * 포인트 색이 화면에서 두 곳(로고 · 오늘 할 일)에만 나오게 해 눈이 그 둘을 잇는다.
 */
export const Logo = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.palette.navy[600]};
  color: ${({ theme }) => theme.palette.white};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  font-size: ${({ theme }) => theme.font.size.sm};
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: auto 0 0 0;
    height: 3px;
    background: ${({ theme }) => theme.colors.point};
  }
`

export const BrandName = styled.span`
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  font-size: ${({ theme }) => theme.font.size.lg};
  letter-spacing: ${({ theme }) => theme.font.letterSpacing.tight};
  white-space: nowrap;
`

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  min-width: 0;
  overflow-x: auto;
`

export const Item = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  height: 36px;
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

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.borderFocus};
    outline-offset: -2px;
  }
`

export const Right = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-shrink: 0;
`
