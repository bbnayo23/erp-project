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
  /*
   * 드로어는 가로도 잘라야 한다.
   *
   * 패널은 화면 밖(translateX(100%))에서 출발하는데 세로만 막으면 그동안 문서에 가로
   * 넘침이 생겨, 스크롤바가 번쩍이고 뒤 화면이 밀린다.
   */
  overflow: ${({ $align }) => ($align === 'center' ? 'hidden auto' : 'hidden')};
`
