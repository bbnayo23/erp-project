import { useCallback } from 'react'
import { useToast } from '@/components/common/Toast'
import type { ActionOutcome } from '@/store/erpStore'
import {
  ACTION_DUPLICATE_TITLE,
  ACTION_FAILURE,
  ACTION_FAILURE_TITLE,
  type ActionSuccessMessage,
} from './messages'

export type ReportAction = (outcome: ActionOutcome, success: ActionSuccessMessage) => boolean

/**
 * 스토어 액션의 결과를 토스트로 옮긴다.
 *
 * 주문 상세와 발주 현황이 같은 액션(검사 · 입고)을 부르므로 결과를 알리는 방식도 같아야
 * 한다. 화면마다 따로 쓰면 한쪽만 tone 을 잘못 골라 같은 실패가 화면에 따라 빨갛게도
 * 회색으로도 뜬다.
 *
 * 성공 여부를 돌려준다 — 호출부가 요청 토큰을 올리거나 입력을 비우는 데 쓴다.
 */
export function useActionReport(): ReportAction {
  const toast = useToast()

  return useCallback(
    (outcome, success) => {
      if (outcome.ok) {
        toast.success(success.title, { description: success.description })
        return true
      }

      const description = outcome.code ? ACTION_FAILURE[outcome.code] : '다시 시도해 주세요.'

      // 반복 요청은 오류가 아니라 이미 되어 있다는 뜻이다 (도메인 §DUPLICATE_REQUEST)
      if (outcome.code === 'DUPLICATE_REQUEST') {
        toast.info(ACTION_DUPLICATE_TITLE, { description })
        return false
      }

      toast.danger(ACTION_FAILURE_TITLE, { description })
      return false
    },
    [toast],
  )
}
