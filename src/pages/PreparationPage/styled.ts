import styled from 'styled-components'
import { pageEnter } from '@/styles/animations'

export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  /* 카드끼리는 떨어져 서야 각자의 테두리가 경계로 읽힌다 */
  gap: ${({ theme }) => theme.spacing[3]};

  ${pageEnter}
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

/**
 * 필터 컨트롤 묶음.
 *
 * Panel 의 FilterBar 안에 한 겹 더 두는 이유는 안내가 이 영역을 가리켜야 하는데,
 * Panel 이 `data-tour` 같은 속성을 전달하지 않기 때문이다. 공통 컴포넌트에 안내 전용
 * props 를 뚫는 대신 페이지가 소유하는 박스에 붙인다.
 */
export const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
`

export const FilterSpacer = styled.div`
  flex: 1;
`

export const ResultCount = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`

/**
 * 배송일 그룹 머리.
 *
 * 목록이 26줄이면 '오늘 나갈 것이 몇 건인가' 를 눈으로 세게 된다. 날짜가 바뀌는 자리에
 * 줄을 긋고 건수를 적으면 세지 않아도 된다.
 *
 * 표 밖에 두지 않고 표의 행으로 둔다 — 밖에 두면 컬럼 정렬이 그룹마다 어긋난다.
 */
export const GroupRow = styled.tr`
  background: ${({ theme }) => theme.colors.surfaceMuted};

  th {
    padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.tableCell.paddingX};
    text-align: left;
    font-size: ${({ theme }) => theme.font.size.sm};
    font-weight: ${({ theme }) => theme.font.weight.bold};
    color: ${({ theme }) => theme.colors.textMuted};

    box-shadow:
      inset 0 1px 0 ${({ theme }) => theme.colors.border},
      inset 0 -1px 0 ${({ theme }) => theme.colors.border};
  }
`

export const GroupCount = styled.span`
  font-weight: ${({ theme }) => theme.font.weight.regular};
  color: ${({ theme }) => theme.colors.textSubtle};
`

/** 준비 대상이 아닌 주문 — 처리할 것이 없다는 사실이 행에서 읽혀야 한다 */
export const ExcludedMark = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textSubtle};
`
