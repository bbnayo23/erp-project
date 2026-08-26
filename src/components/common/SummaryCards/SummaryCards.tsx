import { Card, Grid, Hint, Label, Value } from './styled'
import type { SummaryCardsProps } from './types'

/**
 * 화면 상단 요약 지표 묶음.
 * 카드 하나만 쓰는 화면이 없어 그리드까지 한 컴포넌트로 둔다 — 화면마다 그리드를
 * 따로 조립하면 컬럼 규칙이 갈린다.
 */
export function SummaryCards({ items, className }: SummaryCardsProps) {
  return (
    <Grid className={className}>
      {items.map((item) => (
        <Card key={item.label}>
          <Label>{item.label}</Label>
          <Value $tone={item.tone ?? 'default'}>{item.value}</Value>
          {item.hint && <Hint>{item.hint}</Hint>}
        </Card>
      ))}
    </Grid>
  )
}
