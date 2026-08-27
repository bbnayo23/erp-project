import { Icon } from '@/components/common/Icon'
import { Action, Body, Card, Grid, Head, Hint, Label, Value } from './styled'
import type { SummaryCardItem, SummaryCardsProps } from './types'

/**
 * 화면 상단 지표 줄 (KPI).
 *
 * **지표가 아니라 작업 대기열이다.** 세는 화면이 아니라 고르는 화면이라, 한 칸은
 * 네 층으로 읽힌다.
 *   라벨(무엇이) → 값(얼마나) → 힌트(왜) → 행동(그래서 뭘 하나)
 *
 * **미니 차트를 두지 않는다.** 한때 칸마다 막대 그래프를 그렸는데, 축도 눈금도 없는
 * 그림은 '지금 이 칸이 전체 어디쯤인가' 만 말했다. 그 답은 라벨 옆 비율 한 줄이 더
 * 정확하게 하고 자리도 덜 먹는다. 이 화면에서 담당자가 필요한 것은 추세가 아니라
 * 지금 몇 건인지와 그래서 무엇을 눌러야 하는지다.
 *
 * `onSelect` 가 있으면 칸이 필터 버튼이 된다. 담당자가 '재고 부족 8건' 을 보고 그
 * 8건을 보려면 아래 필터를 다시 찾아 고르는 게 아니라 방금 본 숫자를 누르면 된다.
 */
function CardContent({ item }: { item: SummaryCardItem }) {
  return (
    <>
      <Head>
        <Label>{item.label}</Label>
      </Head>

      <Value $tone={item.tone ?? 'default'}>{item.value}</Value>
      {item.hint && <Hint>{item.hint}</Hint>}

      {/* 다음 행동. 누를 수 있는 칸에만 붙는다 — 읽기 전용 칸에 화살표를 두면 눌러본다 */}
      {item.action && item.onSelect && (
        <Action>
          {item.action}
          <Icon name="arrowRight" size={11} />
        </Action>
      )}
    </>
  )
}

export function SummaryCards({ items, label, className }: SummaryCardsProps) {
  return (
    <Grid className={className} aria-label={label}>
      {items.map((item) => (
        <Card key={item.label}>
          {item.onSelect ? (
            <Body
              as="button"
              type="button"
              onClick={item.onSelect}
              aria-pressed={item.selected ?? false}
              $tone={item.tone ?? 'default'}
              $selected={item.selected ?? false}
              $clickable
            >
              <CardContent item={item} />
            </Body>
          ) : (
            <Body $tone={item.tone ?? 'default'} $selected={false} $clickable={false}>
              <CardContent item={item} />
            </Body>
          )}
        </Card>
      ))}
    </Grid>
  )
}
