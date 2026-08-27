import styled, { keyframes } from 'styled-components'
import type { OverlayLayer } from './types'

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

export const OverlayRoot = styled.div<{ $align: 'center' | 'end'; $layer: OverlayLayer }>`
  position: fixed;
  inset: 0;
  z-index: ${({ theme, $layer }) => theme.zIndex[$layer]};
  display: flex;
  align-items: ${({ $align }) => ($align === 'center' ? 'center' : 'stretch')};
  justify-content: ${({ $align }) => ($align === 'center' ? 'center' : 'flex-end')};
  padding: ${({ theme, $align }) => ($align === 'center' ? theme.spacing[6] : '0')};
  background: ${({ theme }) => theme.colors.overlay};
  animation: ${fadeIn} ${({ theme }) => theme.duration.fast} ${({ theme }) => theme.easing.entrance};
  overflow-y: ${({ $align }) => ($align === 'center' ? 'auto' : 'hidden')};
`
