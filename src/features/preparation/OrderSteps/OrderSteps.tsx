import { Fragment, type ReactNode } from 'react'
import { Icon } from '@/components/common/Icon'
import type { OrderStep } from '@/features/preparation/types'
import { Arrow, Item, Next, NextHint, NextLabel, NextText, Root, Step } from './styled'

export interface OrderStepsProps {
  steps: OrderStep[]
  /** 지금 할 일. 없으면(출고 완료 · 확인 필요) 다음 줄을 그리지 않는다 */
  current?: OrderStep
  /** 지금 할 일에 해당하는 버튼 */
  action?: ReactNode
  /** 할 일이 없을 때 대신 적을 한 줄 */
  fallback?: string
}

/**
 * 주문이 출고까지 가는 길과 지금 위치.
 *
 * 준비상태 배지는 '무엇이 막혔는가' 를 말하고, 이 줄은 '그래서 다음에 무엇을 하는가'
 * 를 말한다. 둘은 다른 질문이라 같은 자리에 겹쳐 두지 않는다.
 *
 * 끝난 칸에 체크를 붙이는 이유: 색만으로 done/todo 를 가르면 흑백 출력과 색각 이상에서
 * 구분이 사라진다.
 */
export function OrderSteps({ steps, current, action, fallback }: OrderStepsProps) {
  return (
    <div>
      <Root aria-label="처리 단계">
        {steps.map((step, index) => (
          <Fragment key={step.key}>
            {index > 0 && (
              <Arrow aria-hidden>
                <Icon name="arrowRight" size={12} />
              </Arrow>
            )}
            <Item aria-current={step.state === 'CURRENT' ? 'step' : undefined}>
              <Step $state={step.state}>
                {step.state === 'DONE' && <Icon name="check" size={11} />}
                {step.label}
              </Step>
            </Item>
          </Fragment>
        ))}
      </Root>

      {(current || fallback) && (
        <Next>
          <NextText>
            <NextLabel>{current ? `다음 할 일 — ${current.label}` : fallback}</NextLabel>
            {current?.hint && <NextHint>{current.hint}</NextHint>}
          </NextText>
          {action}
        </Next>
      )}
    </div>
  )
}
