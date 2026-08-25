import { forwardRef, useEffect, useRef, type InputHTMLAttributes, type ReactNode } from 'react'
import styled, { css } from 'styled-components'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  /** 전체선택 헤더 체크박스용 */
  indeterminate?: boolean
}

const Root = styled.label<{ $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  color: ${({ theme, $disabled }) => ($disabled ? theme.colors.textDisabled : theme.colors.text)};
  font-size: ${({ theme }) => theme.font.size.md};
  user-select: none;
`

const Box = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radius.xs};
  border: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surface};
  transition:
    background-color ${({ theme }) => theme.duration.fast} ${({ theme }) => theme.easing.standard},
    border-color ${({ theme }) => theme.duration.fast} ${({ theme }) => theme.easing.standard},
    box-shadow ${({ theme }) => theme.duration.fast} ${({ theme }) => theme.easing.standard};

  svg {
    width: 12px;
    height: 12px;
    color: ${({ theme }) => theme.colors.onPrimary};
    opacity: 0;
    transform: scale(0.7);
    transition:
      opacity ${({ theme }) => theme.duration.fast},
      transform ${({ theme }) => theme.duration.fast};
  }
`

const NativeInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;

  &:focus-visible + ${Box} {
    border-color: ${({ theme }) => theme.colors.borderFocus};
    box-shadow: ${({ theme }) => theme.shadow.focus};
  }

  ${({ theme }) => css`
    &:checked + ${Box}, &:indeterminate + ${Box} {
      background: ${theme.colors.primary};
      border-color: ${theme.colors.primary};
    }

    &:checked + ${Box} svg,
    &:indeterminate + ${Box} svg {
      opacity: 1;
      transform: scale(1);
    }

    &:disabled + ${Box} {
      background: ${theme.colors.surfaceDisabled};
      border-color: ${theme.colors.border};
    }

    &:disabled:checked + ${Box} svg {
      color: ${theme.colors.textDisabled};
    }
  `}
`

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, indeterminate = false, disabled, className, ...rest },
  ref,
) {
  const innerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const node = innerRef.current
    if (node) node.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <Root className={className} $disabled={disabled}>
      <NativeInput
        type="checkbox"
        disabled={disabled}
        ref={(node) => {
          innerRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        {...rest}
      />
      <Box aria-hidden="true">
        {indeterminate ? (
          <svg viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6.2l2.6 2.6L10 3.4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </Box>
      {label}
    </Root>
  )
})

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
}

const RadioBox = styled(Box)`
  border-radius: ${({ theme }) => theme.radius.full};

  &::after {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ theme }) => theme.colors.onPrimary};
    opacity: 0;
    transform: scale(0.6);
    transition:
      opacity ${({ theme }) => theme.duration.fast},
      transform ${({ theme }) => theme.duration.fast};
  }
`

const RadioInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;

  &:focus-visible + ${RadioBox} {
    border-color: ${({ theme }) => theme.colors.borderFocus};
    box-shadow: ${({ theme }) => theme.shadow.focus};
  }

  ${({ theme }) => css`
    &:checked + ${RadioBox} {
      background: ${theme.colors.primary};
      border-color: ${theme.colors.primary};
    }

    &:checked + ${RadioBox}::after {
      opacity: 1;
      transform: scale(1);
    }

    &:disabled + ${RadioBox} {
      background: ${theme.colors.surfaceDisabled};
      border-color: ${theme.colors.border};
    }
  `}
`

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, disabled, className, ...rest },
  ref,
) {
  return (
    <Root className={className} $disabled={disabled}>
      <RadioInput type="radio" ref={ref} disabled={disabled} {...rest} />
      <RadioBox aria-hidden="true" />
      {label}
    </Root>
  )
})
