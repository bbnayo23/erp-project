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
export const useOverlay = <T extends HTMLElement>({
  open,
  onClose,
  closeOnEsc = true,
}: UseOverlayOptions) => {
  const panelRef = useRef<T>(null)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape') onClose()
    }

    /*
     * 스크롤은 body 가 아니라 본문 영역이 갖는다 (AppLayout). body 를 잠가도 뒤 목록이
     * 그대로 굴러가므로, 실제로 굴러가는 요소를 찾아 잠근다.
     */
    const scroller = document.querySelector<HTMLElement>('[data-app-scroll]')
    const previousOverflow = scroller?.style.overflow ?? ''
    if (scroller) scroller.style.overflow = 'hidden'

    document.addEventListener('keydown', onKeyDown)

    return () => {
      if (scroller) scroller.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, closeOnEsc, onClose])

  useEffect(() => {
    if (!open) return

    // 렌더 직후에는 노드가 아직 붙지 않았을 수 있어 한 틱 미룬다
    const timer = window.setTimeout(() => {
      /*
       * preventScroll 이 핵심이다.
       *
       * 드로어 패널은 열리는 순간 화면 밖(translateX(100%))에 있다. 그냥 focus() 하면
       * 브라우저가 그 자리를 보이게 하려고 스크롤을 옮겨, 슬라이드 도중에 화면이
       * 튀거나 패널이 엉뚱한 방향에서 나타난 것처럼 보인다.
       */
      panelRef.current?.focus({ preventScroll: true })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [open])

  return { panelRef }
}
