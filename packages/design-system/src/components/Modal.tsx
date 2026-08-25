import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styled, { css, keyframes } from 'styled-components'
import { IconButton } from './Button'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  /** 하단 액션 영역 */
  footer?: ReactNode
  size?: ModalSize
  /** 딤 클릭으로 닫기 (기본 true) */
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  hideCloseButton?: boolean
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.overlay};
  animation: ${fadeIn} ${({ theme }) => theme.duration.fast} ${({ theme }) => theme.easing.entrance};
  overflow-y: auto;
`

const MAX_WIDTH: Record<ModalSize, string> = {
  sm: '400px',
  md: '560px',
  lg: '720px',
  xl: '960px',
}

const Panel = styled.div<{ $size: ModalSize }>`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: ${({ $size }) => MAX_WIDTH[$size]};
  max-height: calc(100vh - ${({ theme }) => theme.spacing[12]});
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.lg};
  animation: ${slideIn} ${({ theme }) => theme.duration.normal}
    ${({ theme }) => theme.easing.entrance};
`

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[5]} ${({ theme }) => theme.spacing[6]};
  border-bottom: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme }) => theme.colors.border};
`

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`

const Title = styled.h2`
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const Description = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

const Body = styled.div<{ $scrollable: boolean }>`
  padding: ${({ theme }) => theme.spacing[6]};
  ${({ $scrollable }) =>
    $scrollable &&
    css`
      overflow-y: auto;
    `}
`

const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  border-top: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-radius: 0 0 ${({ theme }) => theme.radius.lg} ${({ theme }) => theme.radius.lg};
`

const CloseIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" width="18" height="18" aria-hidden="true">
    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  hideCloseButton = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // ESC 로 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, closeOnEsc, onClose])

  // 열릴 때 패널로 포커스 이동 — 스크린리더/키보드 사용자를 위해
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => panelRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <Overlay
      onMouseDown={(event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) onClose()
      }}
    >
      <Panel
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        $size={size}
      >
        {(title || !hideCloseButton) && (
          <Header>
            <TitleGroup>
              {title && <Title>{title}</Title>}
              {description && <Description>{description}</Description>}
            </TitleGroup>
            {!hideCloseButton && (
              <IconButton aria-label="닫기" size="sm" variant="ghost" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            )}
          </Header>
        )}

        <Body $scrollable>{children}</Body>

        {footer && <Footer>{footer}</Footer>}
      </Panel>
    </Overlay>,
    document.body,
  )
}
