import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import styled, { css } from 'styled-components'

export type InputSize = 'sm' | 'md' | 'lg'

const controlBase = css<{ $invalid?: boolean }>`
  width: 100%;
  min-width: 0;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  border: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.borderStrong)};
  border-radius: ${({ theme }) => theme.radius.md};
  transition:
    border-color ${({ theme }) => theme.duration.fast} ${({ theme }) => theme.easing.standard},
    box-shadow ${({ theme }) => theme.duration.fast} ${({ theme }) => theme.easing.standard};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textDisabled};
  }

  &:hover:not(:disabled):not(:read-only) {
    border-color: ${({ theme, $invalid }) =>
      $invalid ? theme.colors.danger : theme.colors.textSubtle};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme, $invalid }) =>
      $invalid ? theme.colors.danger : theme.colors.borderFocus};
    box-shadow: ${({ theme, $invalid }) => ($invalid ? theme.shadow.focusDanger : theme.shadow.focus)};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.surfaceDisabled};
    color: ${({ theme }) => theme.colors.textDisabled};
    cursor: not-allowed;
  }

  &:read-only {
    background: ${({ theme }) => theme.colors.surfaceMuted};
  }
`

const sizeCss = (size: InputSize) => css`
  height: ${({ theme }) => theme.controlHeight[size]};
  font-size: ${({ theme }) => (size === 'sm' ? theme.font.size.sm : theme.font.size.md)};
  padding-inline: ${({ theme }) => (size === 'sm' ? theme.spacing[2] : theme.spacing[3])};
`

const StyledInput = styled.input<{ $invalid?: boolean; $size: InputSize; $hasAddon: boolean }>`
  ${controlBase}
  ${({ $size }) => sizeCss($size)}

  ${({ $hasAddon }) =>
    $hasAddon &&
    css`
      /* 부모 InputGroup 이 테두리를 그린다 */
      border: 0;
      border-radius: 0;
      background: transparent;
      height: 100%;
      padding-inline: 0;

      &:focus {
        box-shadow: none;
      }
      &:disabled {
        background: transparent;
      }
    `}
`

const Group = styled.div<{ $invalid?: boolean; $size: InputSize; $disabled?: boolean }>`
  ${controlBase}
  ${({ $size }) => sizeCss($size)}
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};

  ${({ $disabled, theme }) =>
    $disabled &&
    css`
      background: ${theme.colors.surfaceDisabled};
      color: ${theme.colors.textDisabled};
    `}

  &:focus-within {
    border-color: ${({ theme, $invalid }) =>
      $invalid ? theme.colors.danger : theme.colors.borderFocus};
    box-shadow: ${({ theme, $invalid }) => ($invalid ? theme.shadow.focusDanger : theme.shadow.focus)};
  }
`

const Addon = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.textSubtle};
  font-size: ${({ theme }) => theme.font.size.sm};
`

// prefix 는 HTML 표준 속성(RDFa, string)이라 ReactNode 로 재정의하려면 제거해야 한다
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  inputSize?: InputSize
  invalid?: boolean
  /** 좌/우 부가 요소 (아이콘, 단위 등). 있으면 그룹 테두리로 렌더된다. */
  prefix?: ReactNode
  suffix?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = 'md', invalid, prefix, suffix, className, disabled, ...rest },
  ref,
) {
  const hasAddon = Boolean(prefix || suffix)

  if (!hasAddon) {
    return (
      <StyledInput
        ref={ref}
        className={className}
        $invalid={invalid}
        $size={inputSize}
        $hasAddon={false}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        {...rest}
      />
    )
  }

  return (
    <Group className={className} $invalid={invalid} $size={inputSize} $disabled={disabled}>
      {prefix && <Addon>{prefix}</Addon>}
      <StyledInput
        ref={ref}
        $invalid={invalid}
        $size={inputSize}
        $hasAddon
        aria-invalid={invalid || undefined}
        disabled={disabled}
        {...rest}
      />
      {suffix && <Addon>{suffix}</Addon>}
    </Group>
  )
})

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

const StyledTextarea = styled.textarea<{ $invalid?: boolean }>`
  ${controlBase}
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.font.size.md};
  line-height: ${({ theme }) => theme.font.lineHeight.normal};
  resize: vertical;
  min-height: 88px;
`

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, rows = 4, ...rest },
  ref,
) {
  return (
    <StyledTextarea
      ref={ref}
      rows={rows}
      $invalid={invalid}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
})
