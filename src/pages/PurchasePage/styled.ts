import styled from 'styled-components'
import { pageEnter } from '@/styles/animations'

export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  /* 카드끼리는 떨어져 서야 각자의 테두리가 경계로 읽힌다 */
  gap: ${({ theme }) => theme.spacing[3]};

  ${pageEnter}
`

/** 값 아래에 한 줄을 더 쌓는 셀 — 문서번호 밑의 구분·공급처, 상태 밑의 다음 행동 */
export const StackCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  align-items: flex-start;
`

export const DocumentId = styled.span`
  font-variant-numeric: tabular-nums;
  font-weight: ${({ theme }) => theme.font.weight.medium};
`

export const Note = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

/** 도착이 늦어지는 문서는 목록을 훑을 때 걸려야 한다 */
export const ArrivalLabel = styled.span<{ $overdue: boolean }>`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme, $overdue }) => ($overdue ? theme.colors.dangerText : theme.colors.textSubtle)};
  font-weight: ${({ theme, $overdue }) =>
    $overdue ? theme.font.weight.semibold : theme.font.weight.regular};
`

/** 입고 수량 입력 + 버튼을 한 줄에 */
export const ReceiveControl = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;
  justify-content: flex-end;

  input {
    width: 72px;
  }
`

export const Muted = styled.span`
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

/** 부족분 발주는 주문 상세에 있다 — 여기서 그 길을 알려준다 */
/** 입고로 늘어난 수량 — 이 화면에서 담당자가 확인하러 오는 숫자다 */
export const Increase = styled.span`
  font-variant-numeric: tabular-nums;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.successText};
`

export const OrderLink = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};

  a {
    color: ${({ theme }) => theme.colors.textLink};
  }
`
