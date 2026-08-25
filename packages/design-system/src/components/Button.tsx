import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import styled, { css, type DefaultTheme } from 'styled-components'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** 로딩 중에는 자동으로 disabled 처리된다 */
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

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
          border-color: ${colors.borderStrong};
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
        &:active:not(:disabled) {
          background: ${colors.surfaceMuted};
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

const sizeStyle = (theme: DefaultTheme, size: ButtonSize) => {
  const map = {
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
  }
  return map[size]
}

const StyledButton = styled.button<{
  $variant: ButtonVariant
  $size: ButtonSize
  $fullWidth: boolean
  $loading: boolean
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

  ${({ $loading }) =>
    $loading &&
    css`
      cursor: progress;
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
    width: 1em;
    height: 1em;
  }
`

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <StyledButton
      ref={ref}
      type={type}
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      $loading={loading}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size={size === 'lg' ? 'md' : 'sm'} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </StyledButton>
  )
})

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'fullWidth'> {
  /** 아이콘만 있는 버튼은 접근 가능한 이름이 반드시 필요하다 */
  'aria-label': string
}

const StyledIconButton = styled(StyledButton)`
  padding-inline: 0;
  aspect-ratio: 1 / 1;
`

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', size = 'md', loading = false, disabled, children, type = 'button', ...rest },
  ref,
) {
  return (
    <StyledIconButton
      ref={ref}
      type={type}
      $variant={variant}
      $size={size}
      $fullWidth={false}
      $loading={loading}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : children}
    </StyledIconButton>
  )
})
