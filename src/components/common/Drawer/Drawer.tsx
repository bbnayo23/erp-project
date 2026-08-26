import { IconButton } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { Overlay, useOverlay } from '@/components/common/Overlay'
import { Body, Description, Footer, Header, Panel, Title, TitleGroup } from './styled'
import type { DrawerProps } from './types'

/**
 * 우측 슬라이드 패널.
 *
 * 모달과 달리 배경 목록이 계속 보이므로, 표에서 한 건씩 훑어보는 상세 화면에 쓴다.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width,
  closeOnOverlayClick = true,
  closeOnEsc = true,
}: DrawerProps) {
  const { panelRef } = useOverlay<HTMLElement>({ open, onClose, closeOnEsc })

  if (!open) return null

  return (
    <Overlay align="end" onDismiss={closeOnOverlayClick ? onClose : undefined}>
      <Panel
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        $width={width}
      >
        <Header>
          <TitleGroup>
            {title && <Title>{title}</Title>}
            {description && <Description>{description}</Description>}
          </TitleGroup>
          <IconButton aria-label="닫기" size="sm" variant="ghost" onClick={onClose}>
            <Icon name="close" />
          </IconButton>
        </Header>

        <Body>{children}</Body>

        {footer && <Footer>{footer}</Footer>}
      </Panel>
    </Overlay>
  )
}
