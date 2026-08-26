import styled from 'styled-components'

export const Root = styled.select`
  height: ${({ theme }) => theme.controlHeight.md};
  padding-inline: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radius.md};
  border: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surface};
  font-size: ${({ theme }) => theme.font.size.md};

  &:focus-visible {
    outline: none;
    border-color: ${({ theme }) => theme.colors.borderFocus};
    box-shadow: ${({ theme }) => theme.shadow.focus};
  }
`
