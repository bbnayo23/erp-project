import styled, { css, type DefaultTheme } from 'styled-components'
import type { ButtonSize, ButtonVariant } from './types'

const variantStyle = (theme: DefaultTheme, variant: ButtonVariant) => {
  const { colors, shadow } = theme

  switch (variant) {
    case 'primary':
      return css`
        background: ${colors.primary};
        color: ${colors.onPrimary};
        border-color: ${colors.primary};

        &:hover:not(:disabled) {
          background: ${colors.primaryHover};
          border-color: ${colors.primaryHover};
        }
        &:active:not(:disabled) {
          background: ${colors.primaryActive};
          border-color: ${colors.primaryActive};
        }
        &:focus-visible {
          box-shadow: ${shadow.focus};
        }
      `
    case 'secondary':
      return css`
        background: ${colors.surface};
        color: ${colors.text};
        border-color: ${colors.borderStrong};

        &:hover:not(:disabled) {
          background: ${colors.surfaceHover};
        }
        &:active:not(:disabled) {
          background: ${colors.surfaceMuted};
        }
        &:focus-visible {
          box-shadow: ${shadow.focus};
        }
      `
    case 'ghost':
      return css`
        background: transparent;
        color: ${colors.textMuted};
        border-color: transparent;

        &:hover:not(:disabled) {
          background: ${colors.surfaceHover};
          color: ${colors.text};
        }
        &:focus-visible {
          box-shadow: ${shadow.focus};
        }
      `
    case 'danger':
      return css`
        background: ${colors.danger};
        color: ${colors.onPrimary};
        border-color: ${colors.danger};

        &:hover:not(:disabled) {
          background: ${colors.dangerHover};
          border-color: ${colors.dangerHover};
        }
        &:focus-visible {
          box-shadow: ${shadow.focusDanger};
        }
      `
    case 'link':
      return css`
        background: transparent;
        color: ${colors.textLink};
        border-color: transparent;
        padding-inline: 0;
        height: auto;

        &:hover:not(:disabled) {
          text-decoration: underline;
        }
        &:focus-visible {
          box-shadow: ${shadow.focus};
        }
      `
  }
}

const sizeStyle = (theme: DefaultTheme, size: ButtonSize) =>
  ({
    sm: css`
      height: ${theme.controlHeight.sm};
      padding-inline: ${theme.spacing[3]};
      font-size: ${theme.font.size.sm};
      gap: ${theme.spacing[1]};
    `,
    md: css`
      height: ${theme.controlHeight.md};
      padding-inline: ${theme.spacing[4]};
      font-size: ${theme.font.size.md};
      gap: ${theme.spacing[2]};
    `,
    lg: css`
      height: ${theme.controlHeight.lg};
      padding-inline: ${theme.spacing[5]};
      font-size: ${theme.font.size.lg};
      gap: ${theme.spacing[2]};
    `,
  })[size]

export const ButtonRoot = styled.button<{
  $variant: ButtonVariant
  $size: ButtonSize
  $fullWidth: boolean
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  white-space: nowrap;
  border-radius: ${({ theme }) => theme.radius.md};
  border: ${({ theme }) => theme.borderWidth.thin} solid transparent;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  line-height: 1;
  transition:
    background-color ${({ theme }) => theme.duration.fast} ${({ theme }) => theme.easing.standard},
    border-color ${({ theme }) => theme.duration.fast} ${({ theme }) => theme.easing.standard},
    box-shadow ${({ theme }) => theme.duration.fast} ${({ theme }) => theme.easing.standard},
    color ${({ theme }) => theme.duration.fast} ${({ theme }) => theme.easing.standard};

  ${({ theme, $size }) => sizeStyle(theme, $size)}
  ${({ theme, $variant }) => variantStyle(theme, $variant)}

  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}

  &:disabled {
    cursor: not-allowed;
    background: ${({ theme, $variant }) =>
      $variant === 'ghost' || $variant === 'link' ? 'transparent' : theme.colors.surfaceDisabled};
    color: ${({ theme }) => theme.colors.textDisabled};
    border-color: ${({ theme, $variant }) =>
      $variant === 'ghost' || $variant === 'link' ? 'transparent' : theme.colors.border};
    box-shadow: none;
  }

  /* 아이콘 슬롯은 텍스트 baseline 과 어긋나지 않도록 flex 중앙 정렬 */
  > svg {
    flex-shrink: 0;
  }
`

export const IconButtonRoot = styled(ButtonRoot)`
  padding-inline: 0;
  aspect-ratio: 1 / 1;
`
