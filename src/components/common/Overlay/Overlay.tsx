import { createPortal } from 'react-dom'
import { OverlayRoot } from './styled'
import type { OverlayProps } from './types'

/**
 * 딤 배경 + 포털. 패널 자체는 넘겨받은 children 이 그린다.
 *
 * 닫기 판정에 mousedown 을 쓰는 이유: 패널 안에서 드래그를 시작해 딤에서 손을 떼는
 * 경우에도 click 은 딤에서 발생해 의도치 않게 닫힌다.
 */
export function Overlay({ align = 'center', layer = 'modal', onDismiss, children }: OverlayProps) {
  return createPortal(
    <OverlayRoot
      $align={align}
      $layer={layer}
      onMouseDown={(event) => {
        if (onDismiss && event.target === event.currentTarget) onDismiss()
      }}
    >
      {children}
    </OverlayRoot>,
    document.body,
  )
}
