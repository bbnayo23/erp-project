import styled from 'styled-components'

export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`

/** 값 아래에 한 줄을 더 쌓는 셀 — 품목명 밑의 코드·유형, 상태 배지 밑의 설명 */
export const StackCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  align-items: flex-start;
`

/** 개체 칸 — 버튼과 경고를 오른쪽에 맞춰 쌓는다 */
export const SerialCell = styled(StackCell)`
  align-items: flex-end;
`

export const Note = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

/** 04_재고현황과 05_개체재고가 어긋난 행 — 예약이 막히는 원인이라 눈에 걸려야 한다 */
export const Warning = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.dangerText};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

export const Muted = styled.span`
  color: ${({ theme }) => theme.colors.textSubtle};
`

/** 가용재고는 이 표에서 담당자가 가장 먼저 보는 숫자다 */
export const Available = styled.span<{ $empty: boolean }>`
  font-weight: ${({ theme, $empty }) =>
    $empty ? theme.font.weight.regular : theme.font.weight.semibold};
  color: ${({ theme, $empty }) => ($empty ? theme.colors.textSubtle : theme.colors.text)};
`

export const FilterSpacer = styled.div`
  flex: 1;
`

export const ResultCount = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`

/** 개체재고 서랍의 머리 숫자 — 보관 · 배정 · 출고 */
export const DrawerMeta = styled.dl`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  flex-wrap: wrap;
  align-items: baseline;
  padding-bottom: ${({ theme }) => theme.spacing[3]};

  div {
    display: flex;
    gap: ${({ theme }) => theme.spacing[2]};
    align-items: baseline;
  }

  dt {
    font-size: ${({ theme }) => theme.font.size.sm};
    color: ${({ theme }) => theme.colors.textSubtle};
  }

  dd {
    font-weight: ${({ theme }) => theme.font.weight.medium};
    font-variant-numeric: tabular-nums;
  }
`

export const DrawerHint = styled.p`
  padding-bottom: ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`
