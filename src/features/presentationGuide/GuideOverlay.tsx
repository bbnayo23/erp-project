import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, IconButton } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { useGuideStore } from './store'
import { GUIDE_STEPS } from './steps'
import type { GuideStep } from './types'
import { Body, Dim, Dock, Eyebrow, Footer, Hint, Nav, Progress, Ring, Root, Title } from './styled'

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

/** 독 높이를 아직 재기 전에 쓸 값 — 두 줄짜리 본문 기준의 대략치라 첫 틱에서 크게 어긋나지 않는다 */
const DOCK_HEIGHT_FALLBACK = 180
/** 독과 강조 대상 사이에 남겨야 할 최소 여백 */
const CLEARANCE = 24

/**
 * 대상을 담고 있는 스크롤 컨테이너를 찾는다.
 *
 * 본문(`[data-app-scroll]`), 서랍, 모달 바디가 각자 다른 컨테이너를 스크롤한다 —
 * 대상이 어느 화면 구조 안에 있든 이 걷기만으로 맞는 컨테이너를 찾는다.
 */
const findScrollParent = (node: HTMLElement): HTMLElement | null => {
  let parent = node.parentElement
  while (parent) {
    const style = getComputedStyle(parent)
    if (/(auto|scroll)/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight) {
      return parent
    }
    parent = parent.parentElement
  }
  return document.scrollingElement as HTMLElement | null
}

/**
 * 발표 가이드 오버레이.
 *
 * **클릭을 막지 않는다.** 이건 관람객용 투어가 아니라 발표자용 대본이다 — 강조된
 * 화면을 발표자가 실제로 조작해야 하므로(예약을 누르고, 입고를 처리하고) 딤과 링
 * 모두 `pointer-events: none` 이고, 조작 가능한 것은 아래 진행 독뿐이다.
 *
 * 스텝이 라우트를 지정하면 그 화면으로 이동하고, `data-tour` 로 대상을 찾아 강조한다.
 * PO-20260721-DMN 처럼 발표 중 실제로 만들어지는 문서는 스텝에 경로를 박아 두지
 * 않는다 — 목록/상세까지만 이동하고, 실제 조작은 발표자가 라이브로 한다.
 */
export const GuideOverlay = () => {
  const isOpen = useGuideStore((state) => state.isOpen)
  const index = useGuideStore((state) => state.index)
  const close = useGuideStore((state) => state.close)
  const next = useGuideStore((state) => state.next)
  const prev = useGuideStore((state) => state.prev)
  const restart = useGuideStore((state) => state.restart)

  const navigate = useNavigate()
  const location = useLocation()

  const [rect, setRect] = useState<Rect | null>(null)
  const scrolledStepId = useRef<string | null>(null)

  // 하단 여백을 넓혀 둔 스크롤 컨테이너들 — 가이드가 닫히면 원래대로 되돌린다
  const paddedScrollParentsRef = useRef<Set<HTMLElement>>(new Set())
  useEffect(() => {
    if (!isOpen) return
    const padded = paddedScrollParentsRef.current
    return () => {
      padded.forEach((el) => {
        el.style.paddingBottom = ''
      })
      padded.clear()
    }
  }, [isOpen])

  /*
   * 독 자신의 높이. 스텝마다 본문 길이가 달라 높이가 바뀌고, 스크롤 여백 계산이
   * 그 높이를 기준으로 한다 — ResizeObserver 값을 캐시해 두면 이번 스텝의 새 본문이
   * 그려진 직후 첫 계산에서 지난 스텝의(보통 더 짧은) 높이를 잠깐 쓰게 된다.
   * DOM 에서 매번 직접 재면 그 한 틱짜리 오차가 생기지 않는다.
   */
  const dockNodeRef = useRef<HTMLDivElement | null>(null)
  const setDockNode = useCallback((node: HTMLDivElement | null) => {
    dockNodeRef.current = node
  }, [])
  const measureDockHeight = () =>
    dockNodeRef.current?.getBoundingClientRect().height ?? DOCK_HEIGHT_FALLBACK

  // index 는 스토어가 [0, GUIDE_STEPS.length) 로 항상 clamp 해서 준다
  const step = GUIDE_STEPS[index] as GuideStep

  // 스텝이 라우트를 지정하면 그 화면으로 옮긴다 — 이미 그 화면이면 아무 일도 하지 않는다.
  useEffect(() => {
    if (!isOpen || !step.path) return
    const target = new URL(step.path, window.location.origin)
    const current = location.pathname + location.search
    if (current !== target.pathname + target.search) navigate(step.path)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step.id])

  // 대상을 찾아 자리를 잰다. 라우팅 뒤 렌더가 끝나기까지, 그리고 라이브 조작으로 값이
  // 바뀌는 동안에도 계속 다시 재야 하므로 열려 있는 동안 주기적으로 반복한다.
  useEffect(() => {
    if (!isOpen) return

    const measure = () => {
      if (!step.selector) {
        setRect(null)
        return
      }
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.selector}"]`)
      if (!el) {
        setRect(null)
        return
      }
      const box = el.getBoundingClientRect()
      setRect({ top: box.top, left: box.left, width: box.width, height: box.height })

      /*
       * 독은 항상 하단에 그대로 둔다. 대상을 가리지 않는 몫은 스크롤이 진다 —
       * 독이 스텝마다 위·아래로 튀는 것보다, 이미 화면을 계속 넘기는 중인 스크롤이
       * 한 번 더 움직이는 편이 발표자에게 덜 낯설다.
       *
       * `scrollIntoView` 에 맡기지 않고 직접 계산한다. 독은 위치·문서 흐름과 무관한
       * 고정 오버레이라 브라우저의 정렬 계산이 그 존재를 모른다 — 독이 가리는 만큼을
       * 우리가 직접 여백으로 빼줘야 한다.
       */
      if (scrolledStepId.current !== step.id) {
        scrolledStepId.current = step.id
        const scrollParent = findScrollParent(el)
        if (scrollParent) {
          const needed = measureDockHeight() + CLEARANCE

          /*
           * 대상이 그 화면의 마지막 내용이면(발주 현황 하단 표 등) 스크롤이 이미
           * 끝까지 내려가 있어 더 올릴 여지가 없다 — 컨테이너 바닥에 독 높이만큼
           * 여백을 미리 깔아 둬야 그 대상도 독 위로 올라올 자리가 생긴다.
           */
          if (parseFloat(scrollParent.style.paddingBottom || '0') < needed) {
            scrollParent.style.paddingBottom = `${needed}px`
            paddedScrollParentsRef.current.add(scrollParent)
          }

          const containerRect =
            scrollParent === document.scrollingElement
              ? { top: 0, bottom: window.innerHeight }
              : scrollParent.getBoundingClientRect()

          const safeBottom = containerRect.bottom - needed
          const safeTop = containerRect.top + CLEARANCE

          let delta = 0
          if (box.bottom > safeBottom) {
            delta = box.bottom - safeBottom
          } else if (box.top < safeTop) {
            delta = box.top - safeTop
          }

          if (delta !== 0) {
            scrollParent.scrollBy({ top: delta, behavior: 'smooth' })
          }
        }
      }
    }

    // 첫 측정은 다음 매크로태스크로 미룬다 — effect 본문에서 곧바로 setState 를 부르면
    // 같은 커밋 안에서 다시 렌더가 걸린다.
    const timeout = window.setTimeout(measure, 0)
    const interval = window.setInterval(measure, 200)
    return () => {
      window.clearTimeout(timeout)
      window.clearInterval(interval)
    }
  }, [isOpen, step.id, step.selector])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'

      if (event.key === 'Escape') {
        close()
        return
      }
      if (typing) return

      if (event.key === 'ArrowRight') next()
      if (event.key === 'ArrowLeft') prev()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, close, next, prev])

  if (!isOpen) return null

  const isFirst = index === 0
  const isLast = index === GUIDE_STEPS.length - 1
  const slideSteps = GUIDE_STEPS.filter((candidate) => candidate.slide === step.slide)
  const slidePosition = slideSteps.indexOf(step) + 1

  return createPortal(
    <Root>
      {rect ? (
        <Ring
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      ) : (
        <Dim />
      )}

      <Dock ref={setDockNode} role="dialog" aria-label="발표 가이드">
        <Eyebrow>
          <Progress>
            {step.slide}/16 · {step.slideLabel} ({slidePosition}/{slideSteps.length})
          </Progress>
          <Nav>
            {/* 닫았던 자리에서 다시 여는 것이 기본이라, 처음으로 되돌리는 길을 따로 둔다 */}
            {!isFirst && (
              <Button variant="ghost" size="sm" onClick={restart}>
                처음부터
              </Button>
            )}
            <IconButton aria-label="가이드 닫기" size="sm" variant="ghost" onClick={close}>
              <Icon name="close" />
            </IconButton>
          </Nav>
        </Eyebrow>

        <Title>{step.title}</Title>
        <Body>{step.body}</Body>

        <Footer>
          <Nav>
            <Button variant="secondary" size="sm" onClick={prev} disabled={isFirst}>
              이전
            </Button>
            <Button variant="point" size="sm" onClick={isLast ? close : next}>
              {isLast ? '마침' : '다음'}
            </Button>
          </Nav>
          <Hint>← → 로 이동 · Esc 로 닫기</Hint>
        </Footer>
      </Dock>
    </Root>,
    document.body,
  )
}
