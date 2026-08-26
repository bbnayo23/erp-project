import styled from 'styled-components'

export const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.colors.textMuted};

  li::before {
    content: '· ';
  }
`
