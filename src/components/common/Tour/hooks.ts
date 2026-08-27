import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TargetRect, TourStep } from './types'

const findTarget = (step: TourStep): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface UseTour {
  step: TourStep | undefined
  total: number
  position: number
  rect: TargetRect | null
  next: () => void
  prev: () => void
  hasPrev: boolean
}

/**
 * 대상이 있는 다음(또는 이전) 단계를 찾는다.
 *
 * 이 판단은 **클릭 시점에만** 한다. 렌더 중에는 DOM 을 읽을 수 없다 — 안내가 열리는
 * 첫 렌더에서는 페이지가 아직 커밋되지 않아 어떤 대상도 찾히지 않는다.
 */
function seek(steps: TourStep[], from: number, direction: 1 | -1): number {
  for (let i = from; i >= 0 && i < steps.length; i += direction) {
    const step = steps[i]
    if (step && findTarget(step)) return i
  }
  return -1
}

/**
 * 안내의 진행과 대상 위치를 관리한다.
 *
 * **열려 있을 때만 마운트되는 전제로 만들었다.** 그래서 '열릴 때 처음으로 되돌리는'
 * effect 가 없다 — effect 안에서 setState 를 하면 렌더가 계단식으로 돌고, 그 비용이
 * 안내를 여는 순간의 버벅임으로 나온다.
 */
export function useTour(steps: TourStep[], onClose: () => void): UseTour {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<TargetRect | null>(null)

  const step = steps[index]

  const next = useCallback(() => {
    const found = seek(steps, index + 1, 1)
    if (found < 0) {
      onClose()
      return
    }
    setIndex(found)
  }, [steps, index, onClose])

  const prev = useCallback(() => {
    const found = seek(steps, index - 1, -1)
    if (found >= 0) setIndex(found)
  }, [steps, index])

  /**
   * 대상을 화면 안으로 넣고 위치를 잰다.
   *
   * 측정은 rAF 로 미룬다. 레이아웃이 끝난 뒤의 값을 받아야 정확하고, effect 본문에서
   * 바로 setState 하면 렌더가 한 번 더 도는 것을 React 가 경고한다.
   */
  useEffect(() => {
    if (!step) return

    const target = findTarget(step)
    if (!target) return

    const reduced = prefersReducedMotion()

    // jsdom 에는 scrollIntoView 가 없다 — 테스트에서 죽지 않아야 한다
    target.scrollIntoView?.({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })

    let frame = 0
    const measure = () => {
      const box = target.getBoundingClientRect()
      setRect({ top: box.top, left: box.left, width: box.width, height: box.height })
    }
    const schedule = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(measure)
    }

    schedule()
    // 부드러운 스크롤이 끝난 뒤의 자리를 한 번 더 잡는다
    const settle = window.setTimeout(schedule, reduced ? 0 : 260)

    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(settle)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
    }
  }, [step])

  /** 키보드로도 넘길 수 있어야 한다 */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault()
        next()
        return
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        prev()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [next, prev, onClose])

  return {
    step,
    total: steps.length,
    position: index + 1,
    rect,
    next,
    prev,
    hasPrev: index > 0,
  }
}

/**
 * 처음 열었을 때 한 번만 자동으로 띄운다.
 *
 * 스토리지는 렌더 중에 동기로 읽는다 — effect 로 읽으면 안내가 한 박자 늦게 떠서
 * 화면이 한 번 그려진 뒤 덮이는 것처럼 보인다 (ThemeProvider 와 같은 방식).
 */
export function useFirstVisit(key: string): { pending: boolean; complete: () => void } {
  const [pending, setPending] = useState(() => {
    try {
      return window.localStorage.getItem(key) === null
    } catch {
      // 스토리지를 못 읽으면 자동으로 띄우지 않는다 — 매번 뜨는 쪽이 더 나쁘다
      return false
    }
  })

  const complete = useCallback(() => {
    setPending(false)
    try {
      window.localStorage.setItem(key, 'done')
    } catch {
      // 저장 실패는 무시한다 — 안내는 화면에만 영향을 준다
    }
  }, [key])

  // 이 객체를 의존성으로 받는 쪽(닫기 콜백)이 매 렌더마다 새로 만들어지지 않게 한다
  return useMemo(() => ({ pending, complete }), [pending, complete])
}
