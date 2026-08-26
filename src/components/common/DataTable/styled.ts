import styled, { css } from 'styled-components'
import type { ColumnAlign } from './types'

export const Scroll = styled.div`
  width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
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

export const Tr = styled.tr<{ $clickable: boolean; $selected: boolean }>`
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.surfaceSelected : theme.colors.surface};
  transition: background-color ${({ theme }) => theme.duration.fast}
    ${({ theme }) => theme.easing.standard};

  ${({ $clickable, theme, $selected }) =>
    $clickable &&
    css`
      cursor: pointer;

      &:hover {
        background: ${$selected ? theme.colors.surfaceSelected : theme.colors.surfaceHover};
      }
    `}

  &:last-child td {
    border-bottom: 0;
  }
`

export const StateCell = styled.td`
  padding: 0;
`
