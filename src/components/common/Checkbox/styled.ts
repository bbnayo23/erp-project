import styled from 'styled-components'

export const Root = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  user-select: none;

  /* 강조색은 GlobalStyle 이 accent-color 로 준다 — 여기서는 크기만 맞춘다 */
  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    margin: 0;
    flex-shrink: 0;
    cursor: pointer;
  }
`
