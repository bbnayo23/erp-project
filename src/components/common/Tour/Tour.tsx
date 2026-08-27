import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/common/Button'
import { useTour } from './hooks'
import {
  Actions,
  Body,
  Callout,
  Counter,
  Hint,
  Scrim,
  Spacer,
  Spotlight,
  Tick,
  Title,
  Track,
} from './styled'
import type { TargetRect, TourProps } from './types'

const CALLOUT_WIDTH = 360
const GAP = 20
/** 말풍선 높이를 재기 전에 아래에 자리가 있는지 판단할 때 쓰는 어림값 */
const CALLOUT_ESTIMATE = 220

/**
 * 말풍선을 대상 아래에 두고, 자리가 없으면 위로 올린다.
 * 좌우는 화면을 벗어나지 않게 잘라 맞춘다.
 */
function placeCallout(rect: TargetRect): { top: number; left: number } {
  const viewportHeight = window.innerHeight || 800
  const viewportWidth = window.innerWidth || 1200

  const below = rect.top + rect.height + GAP
  const fitsBelow = below + CALLOUT_ESTIMATE <= viewportHeight
  const top = fitsBelow ? below : Math.max(GAP, rect.top - CALLOUT_ESTIMATE - GAP)

  const centered = rect.left + rect.width / 2 - CALLOUT_WIDTH / 2
  const left = Math.min(Math.max(GAP, centered), Math.max(GAP, viewportWidth - CALLOUT_WIDTH - GAP))

  return { top, left }
}

/**
 * 화면 안내.
 *
 * 볼 곳에 스포트라이트를 얹고, 누르면 다음으로 넘어간다. 정적인 설명 목록을 두는 대신
 * 순서를 강제하는 이유는, 처음 이 화면을 여는 담당자가 무엇부터 볼지를 스스로 정하지
 * 못하기 때문이다 — 화면에 다섯 개 영역이 있으면 다섯 곳을 다 훑고 결국 표만 본다.
 *
 * 안내 중에는 화면 조작을 막는다. 설명을 따라가며 동시에 버튼을 누르면 방금 설명한
 * 화면이 이미 바뀌어 있다.
 *
 * **열려 있을 때만 마운트한다** — 호출부가 `{open && <Tour …/>}` 로 감싼다. 안 열렸을
 * 때도 마운트되어 있으면 '열릴 때 처음으로 되돌리는' effect 가 필요해지고, 그 effect 가
 * setState 를 부르면서 렌더가 계단식으로 돈다.
 */
export function Tour({ steps, onClose, label }: TourProps) {
  const { step, rect, total, position, next, prev, hasPrev } = useTour(steps, onClose)
  const calloutRef = useRef<HTMLDivElement>(null)

  // 단계가 바뀌면 말풍선으로 포커스를 옮긴다 — 키보드·스크린리더가 새 설명을 읽어야 한다
  useEffect(() => {
    if (!step) return
    const timer = window.setTimeout(() => calloutRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [step])

  if (!step) return null

  const placement = rect ? placeCallout(rect) : { top: GAP, left: GAP }

  return createPortal(
    <>
      {/*
        어디를 눌러도 다음으로. 이 안내의 핵심 조작이라 테스트가 짚을 손잡이를 남긴다 —
        스크린리더에는 감춰야 하므로 role 로는 찾을 수 없다.
      */}
      <Scrim onClick={next} aria-hidden data-tour-scrim="" />
      {rect && <Spotlight $rect={rect} aria-hidden />}

      <Callout
        ref={calloutRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        $top={placement.top}
        $left={placement.left}
      >
        <Counter>
          <span>
            {position} / {total}
          </span>
          <Track aria-hidden>
            {Array.from({ length: total }, (_, tick) => (
              <Tick key={tick} $done={tick < position} />
            ))}
          </Track>
        </Counter>

        <Title>{step.title}</Title>
        <Body>{step.body}</Body>
        {step.hint && <Hint>{step.hint}</Hint>}

        <Actions>
          <Button variant="ghost" size="sm" onClick={onClose}>
            건너뛰기
          </Button>
          <Spacer />
          {hasPrev && (
            <Button variant="secondary" size="sm" onClick={prev}>
              이전
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={next}>
            {position >= total ? '안내 닫기' : '다음'}
          </Button>
        </Actions>
      </Callout>
    </>,
    document.body,
  )
}
