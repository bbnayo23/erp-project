import styled from 'styled-components'

export const Root = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  user-select: none;
`
