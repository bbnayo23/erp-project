import styled, { css, type DefaultTheme } from 'styled-components'
import type { ColumnAlign, RowTone } from './types'

export const Scroll = styled.div<{ $maxHeight?: string }>`
  width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;

  /*
   * 헤더 고정은 이 요소가 스크롤 컨테이너가 되어야 성립한다.
   * Panel 이 overflow:hidden 으로 모서리를 다듬고 있어 페이지 스크롤에는 붙지 않는다.
   */
  ${({ $maxHeight }) =>
    $maxHeight &&
    css`
      max-height: ${$maxHeight};
      overflow-y: auto;
    `}
`

export const Table = styled.table`
  width: 100%;
  min-width: max-content;
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.colors.text};
`

export const Th = styled.th<{ $align: ColumnAlign; $sticky: boolean; $width?: string }>`
  position: ${({ $sticky }) => ($sticky ? 'sticky' : 'static')};
  top: 0;
  z-index: ${({ theme, $sticky }) => ($sticky ? theme.zIndex.sticky : 'auto')};
  width: ${({ $width }) => $width ?? 'auto'};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  text-align: ${({ $align }) => $align};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-bottom: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme }) => theme.colors.border};
`

export const Td = styled.td<{ $align: ColumnAlign; $numeric?: boolean }>`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  text-align: ${({ $align }) => $align};
  border-bottom: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme }) => theme.colors.border};
  vertical-align: middle;

  ${({ $numeric }) =>
    $numeric &&
    css`
      font-variant-numeric: tabular-nums;
      font-feature-settings: 'tnum';
    `}
`

const railColor = (theme: DefaultTheme, tone: RowTone): string =>
  ({
    neutral: theme.colors.borderStrong,
    primary: theme.colors.primary,
    point: theme.colors.point,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    info: theme.colors.info,
  })[tone]

export const Tr = styled.tr<{ $clickable: boolean; $selected: boolean; $tone?: RowTone }>`
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.surfaceSelected : theme.colors.surface};
  transition: background-color ${({ theme }) => theme.duration.fast}
    ${({ theme }) => theme.easing.standard};

  /*
   * 상태 레일. box-shadow 로 그리는 이유는 첫 셀에 border-left 를 주면 셀 안쪽
   * 패딩이 밀려 컬럼 정렬이 행마다 어긋나기 때문이다.
   */
  ${({ theme, $tone }) =>
    $tone &&
    css`
      > td:first-child {
        box-shadow: inset 3px 0 0 ${railColor(theme, $tone)};
      }
    `}

  ${({ $clickable, theme, $selected }) =>
    $clickable &&
    css`
      cursor: pointer;

      &:hover {
        background: ${$selected ? theme.colors.surfaceSelected : theme.colors.surfaceHover};
      }

      /* 행이 이동 수단이므로 키보드로도 닿아야 한다 */
      &:focus-visible {
        outline: 2px solid ${theme.colors.borderFocus};
        outline-offset: -2px;
      }
    `}

  &:last-child td {
    border-bottom: 0;
  }
`

export const StateCell = styled.td`
  padding: 0;
`
