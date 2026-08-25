import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes } from 'styled-components'

export type ToastTone = 'info' | 'success' | 'warning' | 'danger'

export interface ToastOptions {
  title: string
  description?: string
  tone?: ToastTone
  /** ms, 0 이면 자동으로 닫지 않음 */
  duration?: number
}

interface ToastItem extends Required<Omit<ToastOptions, 'description'>> {
  id: string
  description?: string
}

interface ToastApi {
  show: (options: ToastOptions) => string
  success: (title: string, description?: string) => string
  error: (title: string, description?: string) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: translateX(0); }
`

const Viewport = styled.div`
  position: fixed;
  top: ${({ theme }) => theme.spacing[5]};
  right: ${({ theme }) => theme.spacing[5]};
  z-index: ${({ theme }) => theme.zIndex.toast};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  width: min(360px, calc(100vw - 32px));
  pointer-events: none;
`

const Item = styled.div<{ $tone: ToastTone }>`
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.border};
  border-left: 3px solid
    ${({ theme, $tone }) =>
      $tone === 'success'
        ? theme.colors.success
        : $tone === 'warning'
          ? theme.colors.warning
          : $tone === 'danger'
            ? theme.colors.danger
            : theme.colors.primary};
  box-shadow: ${({ theme }) => theme.shadow.lg};
  animation: ${slideIn} ${({ theme }) => theme.duration.normal}
    ${({ theme }) => theme.easing.entrance};
`

const Content = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const Title = styled.p`
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const Description = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

const DismissButton = styled.button`
  flex-shrink: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textSubtle};
  padding: 2px;
  line-height: 1;
  border-radius: ${({ theme }) => theme.radius.xs};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<string, number>())
  const seq = useRef(0)

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback(
    ({ title, description, tone = 'info', duration = 4000 }: ToastOptions) => {
      seq.current += 1
      const id = `toast-${seq.current}`
      setToasts((prev) => [...prev, { id, title, description, tone, duration }])

      if (duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), duration)
        timers.current.set(id, timer)
      }
      return id
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      success: (title, description) => show({ title, description, tone: 'success' }),
      error: (title, description) => show({ title, description, tone: 'danger', duration: 6000 }),
    }),
    [show, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <Viewport role="region" aria-label="알림">
            {toasts.map((toast) => (
              <Item key={toast.id} $tone={toast.tone} role="status">
                <Content>
                  <Title>{toast.title}</Title>
                  {toast.description && <Description>{toast.description}</Description>}
                </Content>
                <DismissButton aria-label="알림 닫기" onClick={() => dismiss(toast.id)}>
                  ✕
                </DismissButton>
              </Item>
            ))}
          </Viewport>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast 는 ToastProvider 내부에서만 사용할 수 있습니다.')
  return ctx
}
