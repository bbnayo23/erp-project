import { forwardRef, type SelectHTMLAttributes } from 'react'
import styled, { css } from 'styled-components'

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[]
  selectSize?: 'sm' | 'md' | 'lg'
  invalid?: boolean
  /** 값이 비어있을 때 보여줄 안내 문구 */
  placeholder?: string
}

const Wrapper = styled.div`
  position: relative;
  display: block;
  width: 100%;
  min-width: 0;
`

const Chevron = styled.svg`
  position: absolute;
  right: ${({ theme }) => theme.spacing[3]};
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.colors.textSubtle};
`

const StyledSelect = styled.select<{ $invalid?: boolean; $size: 'sm' | 'md' | 'lg' }>`
  appearance: none;
  width: 100%;
  height: ${({ theme, $size }) => theme.controlHeight[$size]};
  padding-inline: ${({ theme, $size }) =>
    `${$size === 'sm' ? theme.spacing[2] : theme.spacing[3]}`};
  padding-right: ${({ theme }) => theme.spacing[8]};
  font-size: ${({ theme, $size }) => ($size === 'sm' ? theme.font.size.sm : theme.font.size.md)};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  border: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.borderStrong)};
  border-radius: ${({ theme }) => theme.radius.md};
  transition:
    border-color ${({ theme }) => theme.duration.fast} ${({ theme }) => theme.easing.standard},
    box-shadow ${({ theme }) => theme.duration.fast} ${({ theme }) => theme.easing.standard};

  &:hover:not(:disabled) {
    border-color: ${({ theme, $invalid }) =>
      $invalid ? theme.colors.danger : theme.colors.textSubtle};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme, $invalid }) =>
      $invalid ? theme.colors.danger : theme.colors.borderFocus};
    box-shadow: ${({ theme, $invalid }) =>
      $invalid ? theme.shadow.focusDanger : theme.shadow.focus};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.surfaceDisabled};
    color: ${({ theme }) => theme.colors.textDisabled};
    cursor: not-allowed;
  }

  ${({ $invalid }) =>
    $invalid &&
    css`
      /* aria-invalid 와 시각 표현을 일치시킨다 */
    `}
`

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, selectSize = 'md', invalid, placeholder, className, ...rest },
  ref,
) {
  return (
    <Wrapper className={className}>
      <StyledSelect
        ref={ref}
        $invalid={invalid}
        $size={selectSize}
        aria-invalid={invalid || undefined}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled={rest.required}>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </StyledSelect>
      <Chevron viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M6 8l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Chevron>
    </Wrapper>
  )
})
