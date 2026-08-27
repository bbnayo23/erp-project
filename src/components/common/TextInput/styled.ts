import styled, { css } from 'styled-components'

export const Input = styled.input<{ $numeric: boolean }>`
  height: ${({ theme }) => theme.controlHeight.md};
  padding-inline: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.font.size.md};

  ${({ $numeric }) =>
    $numeric
      ? css`
          width: 100%;
          text-align: right;
          font-variant-numeric: tabular-nums;
        `
      : css`
          min-width: 220px;
        `}

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSubtle};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.surfaceDisabled};
    color: ${({ theme }) => theme.colors.textDisabled};
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: none;
    border-color: ${({ theme }) => theme.colors.borderFocus};
    box-shadow: ${({ theme }) => theme.shadow.focus};
  }
`
