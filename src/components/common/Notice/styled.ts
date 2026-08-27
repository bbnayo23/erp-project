import styled from 'styled-components'
import type { NoticeTone } from './types'

export const Root = styled.div<{ $tone: NoticeTone }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.font.size.sm};
  background: ${({ theme, $tone }) =>
    $tone === 'success' ? theme.colors.successSubtle : theme.colors.dangerSubtle};
  color: ${({ theme, $tone }) =>
    $tone === 'success' ? theme.colors.successText : theme.colors.dangerText};
`
