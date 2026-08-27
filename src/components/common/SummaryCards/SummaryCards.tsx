import { Body, Card, Grid, Hint, Label, PointMark, Value } from './styled'
import type { SummaryCardItem, SummaryCardsProps } from './types'

/**
 * 화면 상단 요약 지표 묶음.
 *
 * 카드 하나만 쓰는 화면이 없어 그리드까지 한 컴포넌트로 둔다 — 화면마다 그리드를
 * 따로 조립하면 컬럼 규칙이 갈린다.
 *
 * `onSelect` 가 있으면 카드가 필터 버튼이 된다. 담당자가 '재고 부족 8건' 을 보고
 * 그 8건을 보려면 아래 필터를 다시 찾아 고르는 게 아니라 방금 본 숫자를 누르면 된다.
 */
function CardContent({ item }: { item: SummaryCardItem }) {
  const value = item.tone === 'point' ? <PointMark>{item.value}</PointMark> : item.value

  return (
    <>
      <Label>{item.label}</Label>
      <Value $tone={item.tone ?? 'default'}>{value}</Value>
      {item.hint && <Hint>{item.hint}</Hint>}
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
