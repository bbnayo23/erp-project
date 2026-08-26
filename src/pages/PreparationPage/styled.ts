import styled from 'styled-components'

export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`

/** 배송일 셀 — 날짜와 남은 일수를 두 줄로 쌓는다 */
export const DateCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`

export const DueLabel = styled.span<{ $overdue: boolean }>`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme, $overdue }) => ($overdue ? theme.colors.dangerText : theme.colors.textSubtle)};
  font-weight: ${({ theme, $overdue }) =>
    $overdue ? theme.font.weight.semibold : theme.font.weight.regular};
`

export const OrderId = styled.span`
  font-variant-numeric: tabular-nums;
  font-weight: ${({ theme }) => theme.font.weight.medium};
`

/** 상태 셀 — 배지 아래에 다음 행동을 알려주는 한 줄 */
export const StatusCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  align-items: flex-start;
`

export const Detail = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Priority = styled.span`
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.textSubtle};
`

export const FilterSpacer = styled.div`
  flex: 1;
`

export const ResultCount = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`
