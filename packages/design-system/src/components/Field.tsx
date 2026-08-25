import { useId, type ReactNode } from 'react'
import styled from 'styled-components'

export interface FieldProps {
  label?: ReactNode
  /** 라벨 옆 * 표시 (검증은 별개) */
  required?: boolean
  hint?: ReactNode
  error?: ReactNode
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode
  className?: string
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  min-width: 0;
`

const Label = styled.label`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.colors.textMuted};
`

const RequiredMark = styled.span`
  margin-left: 2px;
  color: ${({ theme }) => theme.colors.danger};
`

const Message = styled.p<{ $error?: boolean }>`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme, $error }) => ($error ? theme.colors.dangerText : theme.colors.textSubtle)};
`

/**
 * label / hint / error 를 묶어 aria 연결까지 처리하는 폼 필드 래퍼.
 * children 은 render prop 이라 어떤 컨트롤이든 감쌀 수 있다.
 */
export function Field({ label, required, hint, error, children, className }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = error ? errorId : hint ? hintId : undefined

  return (
    <Wrapper className={className}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <RequiredMark aria-hidden="true">*</RequiredMark>}
        </Label>
      )}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <Message id={errorId} $error role="alert">
          {error}
        </Message>
      ) : hint ? (
        <Message id={hintId}>{hint}</Message>
      ) : null}
    </Wrapper>
  )
}
