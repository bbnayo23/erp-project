import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, IconButton } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { applyDemoStage, DEMO_STAGE_LABEL, pendingDemoStages, type DemoStage } from './demo'
import { useGuideStore } from './store'
import { GUIDE_STEPS } from './steps'
import type { GuideStep } from './types'
import {
  Applied,
  AppliedLabel,
  Body,
  Dim,
  Dock,
  DockActions,
  Eyebrow,
  Footer,
  Hint,
  Mark,
  MarkOrder,
  Nav,
  Press,
  Progress,
  Ring,
  Root,
  Title,
} from './styled'

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
 * 강조를 보여준 뒤 처리를 실행하기까지의 간격.
 *
 * 스텝에 들어온 즉시 처리하면 화면이 이미 바뀐 상태로 나타나, 무엇을 눌러서 바뀐
 * 것인지 볼 기회가 없다. 강조 → 클릭 표시 → 결과 순으로 한 박자를 준다.
 */
const PRESS_DELAY = 620

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
  const autoDemo = useGuideStore((state) => state.autoDemo)
  const toggleAutoDemo = useGuideStore((state) => state.toggleAutoDemo)

  const navigate = useNavigate()
  const location = useLocation()

  /** 딤을 뚫는 구멍 — 대상이 여럿이면 그것들을 모두 감싸는 사각형 */
  const [rect, setRect] = useState<Rect | null>(null)
  /** 짚어야 할 줄이 여럿일 때 각 줄의 자리. 하나뿐이면 비어 있다(링이 곧 그 줄이다). */
  const [marks, setMarks] = useState<Rect[]>([])
  const scrolledStepId = useRef<string | null>(null)

  /** 이 스텝에서 가이드가 대신 처리한 단계들. 비어 있으면 화면이 바뀌지 않았다는 뜻이다. */
  const [applied, setApplied] = useState<DemoStage[]>([])

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

  /*
   * 이 스텝의 화면이 성립하는 상태를 만든다.
   *
   * 결과를 보여주는 화면(입고 이력 · 배정된 개체 · 출고 완료)은 앞 처리가 끝나 있어야
   * 숫자가 찍힌다. 발표자가 매번 손으로 처리하지 않아도 되도록, 스텝이 선언한 단계까지
   * 스토어 액션으로 맞춘다 — 화면의 버튼이 부르는 것과 같은 액션이라 규칙을 우회하지 않는다.
   *
   * 강조가 버튼인 스텝(`press`)은 한 박자 늦춘다. 강조 → 클릭 표시 → 결과 순서로 보여야
   * 화면이 왜 바뀌었는지 청중이 볼 수 있다.
   */
  useEffect(() => {
    if (!isOpen) return
    const stage = step.demo

    let pressTimer: number | undefined

    // 측정과 같은 이유로 다음 매크로태스크로 미룬다 — 이펙트 본문에서 곧바로 setState 를
    // 부르면 같은 커밋 안에서 다시 렌더가 걸린다.
    const start = window.setTimeout(() => {
      // 시연이 없는 스텝에서도 반드시 비운다 — 앞 스텝의 "대신 처리" 줄이 남으면
      // 방금 아무 일도 없었는데 처리가 있었던 것처럼 읽힌다.
      if (!stage || !autoDemo) {
        setApplied([])
        return
      }

      const stages = pendingDemoStages(stage)
      setApplied(stages)
      if (stages.length === 0) return

      if (!step.press) {
        applyDemoStage(stage)
        return
      }
      pressTimer = window.setTimeout(() => applyDemoStage(stage), PRESS_DELAY)
    }, 0)

    return () => {
      window.clearTimeout(start)
      if (pressTimer !== undefined) window.clearTimeout(pressTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step.id, autoDemo])

  // 대상을 찾아 자리를 잰다. 라우팅 뒤 렌더가 끝나기까지, 그리고 라이브 조작으로 값이
  // 바뀌는 동안에도 계속 다시 재야 하므로 열려 있는 동안 주기적으로 반복한다.
  useEffect(() => {
    if (!isOpen) return

    const measure = () => {
      if (!step.selector) {
        setRect(null)
        setMarks([])
        return
      }

      /*
       * `~=` 로 찾는다. 표의 행은 성격이 여럿일 수 있어(`purchase.row purchase.row.draft`)
       * 앵커에 이름을 공백으로 여러 개 붙인다 — 토큰 하나만 맞아도 집힌다. 값이 하나뿐인
       * 기존 앵커는 그대로 걸린다.
       *
       * 여러 개가 걸리는 스텝이 있다. '봐야 하는 문서 3건' 처럼 목록의 일부를 짚는
       * 자리다 — 표 전체를 강조하면 어느 줄을 보라는 것인지 말하지 못한다.
       */
      const found = [
        ...document.querySelectorAll<HTMLElement>(`[data-tour~="${step.selector}"]`),
      ]
      if (found.length === 0) {
        setRect(null)
        setMarks([])
        return
      }

      const boxes = found.map((node) => node.getBoundingClientRect())
      const el = found[0] as HTMLElement

      // 딤을 뚫는 구멍은 하나다 — 여러 줄을 짚을 때는 그것들을 모두 감싸는 사각형을 쓴다
      const box = {
        top: Math.min(...boxes.map((b) => b.top)),
        left: Math.min(...boxes.map((b) => b.left)),
        right: Math.max(...boxes.map((b) => b.right)),
        bottom: Math.max(...boxes.map((b) => b.bottom)),
      }

      setRect({
        top: box.top,
        left: box.left,
        width: box.right - box.left,
        height: box.bottom - box.top,
      })
      setMarks(
        found.length > 1
          ? boxes.map((b) => ({ top: b.top, left: b.left, width: b.width, height: b.height }))
          : [],
      )

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

  /** 클릭 표시는 누를 자리가 실제로 있고, 그 클릭으로 화면이 바뀔 때만 띄운다 */
  const pressing = Boolean(step.press) && applied.length > 0 && rect !== null

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

      {marks.map((mark, order) => (
        <Mark
          key={`${step.id}-${order}`}
          $order={order}
          aria-hidden
          data-testid="guide-mark"
          style={{ top: mark.top, left: mark.left, width: mark.width, height: mark.height }}
        >
          <MarkOrder>{order + 1}</MarkOrder>
        </Mark>
      ))}

      {pressing && rect && (
        // key 를 스텝으로 두면 스텝이 바뀔 때마다 요소가 새로 붙어 애니메이션이 다시 돈다
        <Press
          key={step.id}
          aria-hidden
          data-testid="guide-press"
          style={{ top: rect.top + rect.height / 2, left: rect.left + rect.width / 2 }}
        />
      )}

      <Dock ref={setDockNode} role="dialog" aria-label="발표 가이드">
        <Eyebrow>
          <Progress>
            {step.slide}/16 · {step.slideLabel} ({slidePosition}/{slideSteps.length})
            {/* 몇 줄을 짚고 있는지 — 화면 밖으로 밀린 줄이 있어도 개수는 여기서 읽힌다 */}
            {marks.length > 1 && ` · 볼 곳 ${marks.length}`}
          </Progress>
          <DockActions>
            {/* 발주 · 입고를 직접 눌러 보이려는 발표자에게는 가이드가 먼저 처리하는 것이 방해다 */}
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={autoDemo}
              onClick={toggleAutoDemo}
              title="결과 화면에 필요한 처리를 가이드가 대신 실행합니다"
            >
              {autoDemo ? '자동 시연 끄기' : '자동 시연 켜기'}
            </Button>
            {/* 닫았던 자리에서 다시 여는 것이 기본이라, 처음으로 되돌리는 길을 따로 둔다 */}
            {!isFirst && (
              <Button variant="ghost" size="sm" onClick={restart}>
                처음부터
              </Button>
            )}
            <IconButton aria-label="가이드 닫기" size="sm" variant="ghost" onClick={close}>
              <Icon name="close" />
            </IconButton>
          </DockActions>
        </Eyebrow>

        <Title>{step.title}</Title>
        <Body>{step.body}</Body>

        {applied.length > 0 && (
          <Applied role="status">
            <AppliedLabel>
              <Icon name="guide" size={13} />
              가이드가 대신 처리
            </AppliedLabel>
            {applied.map((stage) => DEMO_STAGE_LABEL[stage]).join(' → ')}
          </Applied>
        )}

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
