import { describe, expect, it } from 'vitest'
import { createInitialDatabase } from '@/store/erpStore'
import { planPreparation } from '@/domain/preparation/planPreparation'
import { statusDescriptorOf } from '@/features/preparation/utils'

/**
 * 준비상태는 화면에서 6종으로 보인다 (명세 21-1).
 *
 * 내부 코드는 WAITING 하나에 사유를 붙여 들고 있다 — 판정 로직에서 셋의 취급이 같기
 * 때문이다. 그러나 **화면에 나가는 문구는 셋으로 갈라야 한다.** '입고 대기' 한 마디로
 * 뭉치면 담당자가 언제 풀릴지 가늠할 수 없다: 검사만 남은 물량과 아직 생산 중인
 * 물량은 기다리는 시간이 다르다.
 */
describe('준비상태 표기', () => {
  const plan = planPreparation(createInitialDatabase())

  const labelOf = (orderId: string) => {
    const entry = plan.entries.find((candidate) => candidate.order.orderId === orderId)
    if (!entry) throw new Error(`${orderId} 가 계획에 없다`)
    return statusDescriptorOf(entry.preparation).label
  }

  it.each([
    ['ORD202607200016', '바로 준비 가능'],
    ['ORD202607200007', '품질검사 대기'],
    ['ORD202607200008', '생산 완료 대기'],
    ['ORD202607200019', '구매 입고 대기'],
    ['ORD202607200024', '재고 부족'],
    ['ORD202607200011', '확인 필요'],
  ])('%s → %s', (orderId, label) => {
    expect(labelOf(orderId)).toBe(label)
  })

  /** 여러 사유가 겹치면 가장 오래 걸리는 단계를 대표로 보여준다 (명세 waitReason) */
  it('명세가 정한 여섯 가지 문구가 모두 화면에 나온다', () => {
    const labels = new Set(plan.entries.map((entry) => statusDescriptorOf(entry.preparation).label))

    expect([...labels].sort()).toEqual(
      [
        '구매 입고 대기',
        '바로 준비 가능',
        '생산 완료 대기',
        '재고 부족',
        '품질검사 대기',
        '확인 필요',
      ].sort(),
    )
  })
})
