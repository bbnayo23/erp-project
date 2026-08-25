import styled, { keyframes } from 'styled-components'

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const SIZE = {
  sm: '14px',
  md: '18px',
  lg: '28px',
} as const

export interface SpinnerProps {
  size?: keyof typeof SIZE
  /** 기본은 currentColor — 버튼 안에 넣으면 자동으로 글자색을 따라간다 */
  color?: string
}

export const Spinner = styled.span.attrs({ role: 'status', 'aria-label': '로딩 중' })<SpinnerProps>`
  display: inline-block;
  flex-shrink: 0;
  width: ${({ size = 'md' }) => SIZE[size]};
  height: ${({ size = 'md' }) => SIZE[size]};
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  opacity: 0.9;
  color: ${({ color }) => color ?? 'currentColor'};
  animation: ${spin} 0.6s linear infinite;
`

const Center = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.font.size.sm};
`

export function LoadingBlock({ label = '불러오는 중…' }: { label?: string }) {
  return (
    <Center>
      <Spinner size="sm" />
      {label}
    </Center>
  )
}
