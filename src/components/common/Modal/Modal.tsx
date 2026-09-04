import { IconButton } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { Overlay, useOverlay } from '@/components/common/Overlay'
import { Body, Description, Footer, Header, Panel, Title, TitleGroup } from './styled'
import type { ModalProps } from './types'

export const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
}: ModalProps) => {
  const { panelRef } = useOverlay<HTMLDivElement>({ open, onClose, closeOnEsc })

  if (!open) return null

  return (
    <Overlay align="center" onDismiss={closeOnOverlayClick ? onClose : undefined}>
      <Panel
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        $size={size}
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
