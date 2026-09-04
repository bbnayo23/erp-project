import { Icon } from '@/components/common/Icon'
import { formatDateTime } from '@/utils/date'
import { Change, Dot, Root, Separator, Stamp } from './styled'
import type { DataFreshness } from './types'

export interface FreshnessBarProps {
  freshness: DataFreshness
  className?: string
}

/**
 * 지금 보고 있는 숫자가 어느 시점의 것인지 밝힌다.
 *
 * 이 앱의 숫자는 두 겹이다 — 엑셀에서 온 기준시각 스냅샷과, 담당자가 이 화면에서
 * 처리해 그 위에 얹힌 결과. 섞여 있는데 구분이 없으면 "지금 이 재고가 내 조작을
 * 반영한 것인가" 에 화면이 답하지 못한다. 재고 화면이 답해야 하는 첫 물음이다.
 *
 * 세 화면 머리말에 같은 줄을 둔다. 화면마다 다른 자리에 있으면 담당자가 매번 찾는다.
 */
export const FreshnessBar = ({ freshness, className }: FreshnessBarProps) => {
  const { baseAt, changeCount, lastChange } = freshness

  return (
    <Root className={className} data-testid="freshness">
      <Stamp>
        <Icon name="clock" size={12} />
        기준시각 {formatDateTime(baseAt)}
      </Stamp>

      <Separator aria-hidden>·</Separator>

      {changeCount === 0 ? (
        <Change data-testid="freshness-changes">
          이 화면에서 처리한 내역 없음 — 엑셀 그대로입니다
        </Change>
      ) : (
        <Change data-testid="freshness-changes">
          <Dot aria-hidden />내 처리 {changeCount}건
          {lastChange && (
            <>
              {' · 마지막 '}
              {lastChange.label} {lastChange.detail}
            </>
          )}
        </Change>
      )}
    </Root>
  )
}
