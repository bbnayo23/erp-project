import { Icon } from '@/components/common/Icon'
import { formatDateTime } from '@/utils/date'
import {
  Clear,
  Head,
  HeadNote,
  HeadTitle,
  PointTag,
  Root,
  StepButton,
  StepCount,
  StepItem,
  StepLabel,
  StepNo,
  StepTop,
  StepWhere,
  StepWhy,
  Steps,
  Urgent,
} from './styled'
import type { WorkflowGuideProps } from './types'

/**
 * 화면을 열었을 때 무엇부터 할지 알려주는 가이드.
 *
 * 단순한 할 일 목록이 아니다. 앞 네 단계는 사슬이라 순서를 지켜야 한다 — 검사를
 * 통과시키면 입고할 수 있고, 입고하면 대기 주문이 준비 완료로 바뀌어 예약할 수 있다.
 * 거꾸로 하면 같은 목록을 두 번 훑는다. 그래서 번호를 붙이고 근거를 한 줄씩 적는다.
 *
 * 카드를 누르면 그 작업을 하는 자리로 곧장 간다 — 같은 화면이면 필터가 걸리고,
 * 다른 화면이면 이동한다. 가이드를 읽고 다시 필터를 찾아야 하면 가이드가 일을 늘린다.
 */
export function WorkflowGuide({ guide, baseAt, onSelect }: WorkflowGuideProps) {
  return (
    <Root aria-label="오늘 할 일">
      <Head>
        <HeadTitle>
          <PointTag>오늘 할 일</PointTag>
          {guide.next ? `${guide.next.label}부터 시작하세요` : '처리할 작업이 없습니다'}
        </HeadTitle>
        <HeadNote>기준시각 {formatDateTime(baseAt)}</HeadNote>
      </Head>

      {guide.urgent && (
        <Urgent>
          <Icon name="alert" size={16} />
          배송일이 임박한 주문 {guide.urgent.count}건
          {guide.urgent.overdue > 0 && ` (배송일 초과 ${guide.urgent.overdue}건)`} — 순서보다 먼저
          확인하세요.
        </Urgent>
      )}

      {guide.clear ? (
        <Clear>
          <Icon name="check" size={18} />
          검사 · 입고 · 예약 · 출고 · 발주 모두 처리되었습니다.
        </Clear>
      ) : (
        <Steps>
          {guide.steps.map((step, index) => (
            <StepItem key={step.id}>
              <StepButton
                type="button"
                $first={index === 0}
                $tone={step.tone}
                onClick={() => onSelect(step)}
              >
                <StepTop>
                  <StepNo $tone={step.tone}>{step.order}</StepNo>
                  <StepLabel>{step.label}</StepLabel>
                  <StepCount>
                    {step.count}건{step.quantity !== undefined && ` · ${step.quantity}개`}
                  </StepCount>
                </StepTop>
                <StepWhy>{step.why}</StepWhy>
                <StepWhere>
                  {step.target.label}
                  <Icon name="arrowRight" size={13} />
                </StepWhere>
              </StepButton>
            </StepItem>
          ))}
        </Steps>
      )}
    </Root>
  )
}
