import { useEffect, useRef } from 'react'
import type { UseOverlayOptions } from './types'

/**
 * 모달·드로어가 공통으로 필요한 동작을 한 곳에 모은다.
 * - ESC 로 닫기
 * - 열려 있는 동안 배경 스크롤 잠금
 * - 열릴 때 패널로 포커스 이동 (스크린리더·키보드 사용자)
 *
 * 반환한 ref 를 패널 엘리먼트에 붙여야 포커스 이동이 동작한다.
 */
export function useOverlay<T extends HTMLElement>({
  open,
  onClose,
  closeOnEsc = true,
}: UseOverlayOptions) {
  const panelRef = useRef<T>(null)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, closeOnEsc, onClose])

  useEffect(() => {
    if (!open) return
    // 렌더 직후에는 노드가 아직 붙지 않았을 수 있어 한 틱 미룬다
    const timer = window.setTimeout(() => panelRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [open])

  return { panelRef }
}
