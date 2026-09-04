import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/common/Icon'
import { Close, Content, Description, Item, Message, Viewport } from './styled'
import type { ToastApi, ToastItem, ToastOptions, ToastTone } from './types'

const ToastContext = createContext<ToastApi | null>(null)

/** 성공은 읽고 지나가면 되고, 실패는 담당자가 읽고 닫아야 한다 */
const DEFAULT_DURATION: Record<ToastTone, number> = {
  success: 2400,
  info: 2400,
  danger: 0,
}

/**
 * 처리 결과를 화면 가운데에 띄운다.
 *
 * 인라인 배너(Notice)를 화면마다 두던 것을 이리로 옮겼다. 배너는 페이지 위쪽에 붙어
 * 있어 표를 보고 있던 담당자의 시야 밖에서 떴다 — 발주 현황처럼 행 오른쪽 끝의 버튼을
 * 누르는 화면에서는 결과가 반대편 구석에서 나타났다.
 *
 * 토스트는 하나만 띄우지 않고 쌓는다. 입고를 연달아 처리하면 각각의 결과가 남아야
 * 담당자가 몇 건을 처리했는지 셀 수 있다.
 */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  /**
   * id 를 ref 로 센다. 상태로 두면 같은 렌더에서 두 번 띄울 때 같은 id 가 나와
   * React 가 두 토스트를 하나로 본다.
   */
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((previous) => previous.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (tone: ToastTone, message: ReactNode, options?: ToastOptions) => {
      const id = (nextId.current += 1)
      const duration = options?.duration ?? DEFAULT_DURATION[tone]

      setToasts((previous) => [...previous, { ...options, id, message, tone, duration }])

      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        )
      }
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, options) => push('success', message, options),
      danger: (message, options) => push('danger', message, options),
      info: (message, options) => push('info', message, options),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toasts.length > 0 &&
        createPortal(
          /*
           * aria-live 는 목록에 걸어야 한다. 항목마다 걸면 새 토스트가 들어올 때
           * 스크린리더가 라이브 영역이 생긴 것으로 보고 읽지 않는다.
           */
          <Viewport role="status" aria-live="polite">
            {toasts.map((toast) => (
              <Item key={toast.id} $tone={toast.tone}>
                <Content>
                  <Message>{toast.message}</Message>
                  {toast.description && <Description>{toast.description}</Description>}
                </Content>
                <Close type="button" aria-label="알림 닫기" onClick={() => dismiss(toast.id)}>
                  <Icon name="close" size={12} />
                </Close>
              </Item>
            ))}
          </Viewport>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

/**
 * 토스트 API.
 *
 * 프로바이더 밖에서 부르면 던진다 — 결과를 알릴 길이 없는데 조용히 넘어가면 담당자는
 * 처리가 안 된 줄 안다.
 */
export const useToast = (): ToastApi => {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast 는 ToastProvider 안에서만 쓸 수 있습니다')
  return api
}
