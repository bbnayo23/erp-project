import styled, { css } from 'styled-components'
import type { SpacingKey } from '../tokens'

export interface StackProps {
  direction?: 'row' | 'column'
  gap?: SpacingKey
  align?: 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline'
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  wrap?: boolean
  inline?: boolean
  fullWidth?: boolean
}

/** flexbox 래퍼. 레이아웃 때문에 매번 styled 를 새로 만드는 걸 막는 용도. */
export const Stack = styled.div<StackProps>`
  display: ${({ inline }) => (inline ? 'inline-flex' : 'flex')};
  flex-direction: ${({ direction = 'column' }) => direction};
  gap: ${({ theme, gap = 0 }) => theme.spacing[gap]};
  align-items: ${({ align = 'stretch' }) => align};
  justify-content: ${({ justify = 'flex-start' }) => justify};
  flex-wrap: ${({ wrap }) => (wrap ? 'wrap' : 'nowrap')};
  ${({ fullWidth }) =>
    fullWidth &&
    css`
      width: 100%;
    `}
`

export const HStack = styled(Stack).attrs({ direction: 'row' as const })``
export const VStack = styled(Stack).attrs({ direction: 'column' as const })``

/** 남는 공간을 밀어내는 스페이서 */
export const Spacer = styled.div`
  flex: 1 1 auto;
`

export const Divider = styled.hr<{ orientation?: 'horizontal' | 'vertical' }>`
  border: 0;
  margin: 0;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.border};
  ${({ orientation = 'horizontal' }) =>
    orientation === 'horizontal'
      ? css`
          width: 100%;
          height: 1px;
        `
      : css`
          width: 1px;
          align-self: stretch;
        `}
`
