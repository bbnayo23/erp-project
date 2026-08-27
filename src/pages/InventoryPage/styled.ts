import styled, { keyframes } from 'styled-components'
import { pageEnter } from '@/styles/animations'

export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  /* 카드끼리는 떨어져 서야 각자의 테두리가 경계로 읽힌다 */
  gap: ${({ theme }) => theme.spacing[3]};

  ${pageEnter}
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

export const DrawerHint = styled.p`
  padding-bottom: ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

/** 증감 — 늘어난 쪽과 줄어든 쪽의 색을 나눈다 */
export const Delta = styled.span<{ $sign: 'up' | 'down' | 'none' }>`
  font-variant-numeric: tabular-nums;
  font-weight: ${({ theme, $sign }) =>
    $sign === 'none' ? theme.font.weight.regular : theme.font.weight.semibold};
  color: ${({ theme, $sign }) => {
    if ($sign === 'up') return theme.colors.successText
    if ($sign === 'down') return theme.colors.dangerText
    return theme.colors.textSubtle
  }};
`

/**
 * 서랍 본문 — 카드를 세로로 쌓는다.
 *
 * 서랍 안이라고 표가 달라 보이면 안 된다. 페이지의 표와 같은 카드(Panel)에 담고
 * 카드 사이 간격만 여기서 낸다.
 */
export const DrawerStack = styled.div`
  display: flex;
  flex-direction: column;
  /* 구획끼리는 선으로 붙는다 — 간격을 주면 구분선이 허공에 뜬다 */
  gap: 0;
`

const settle = keyframes`
  from { opacity: 0; transform: translateY(-2px); }
  to   { opacity: 1; transform: none; }
`

/**
 * 방금 처리한 자리 표시.
 *
 * "지금 이 숫자가 내 조작을 반영한 것인가" 에 답하는 장치다. 재고 화면에서 숫자만
 * 바뀌면 26줄 중 어디가 바뀐 것인지 다시 찾아야 한다.
 *
 * 마지막 한 번의 처리만 표시한다 — '방금' 이 여러 줄이면 어느 쪽이 방금인지 알 수 없다.
 */
export const JustChanged = styled.span`
  display: inline-flex;
  align-items: center;

  padding: 0 ${({ theme }) => theme.spacing[1]};
  border-radius: ${({ theme }) => theme.radius.sm};

  background: ${({ theme }) => theme.colors.successSubtle};
  color: ${({ theme }) => theme.colors.successText};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};

  animation: ${settle} ${({ theme }) => theme.motion.surface} both;

  ${({ theme }) => theme.reducedMotion} {
    animation: none;
  }
`

/**
 * 항등식 한 줄.
 *
 * `가용재고 = 현재고 − 예약수량` · `현재고 = 보관 + 배정` 두 식을 값과 함께 보여준다.
 * 숫자를 나열하는 것과 다르다 — 담당자가 화면에서 바로 검산할 수 있어야 그 숫자를
 * 믿고 예약을 누른다.
 *
 * 어긋나면(`$broken`) 등호가 `≠` 로 바뀌고 붉게 선다. 04_재고현황과 05_개체재고가
 * 어긋난 상태이고, 수량이 맞아 보여도 예약이 개체 부족으로 막히는 원인이다.
 */
export const Identity = styled.dl<{ $broken?: boolean }>`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: baseline;

  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.tableCell.paddingX};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme, $broken }) =>
    $broken ? theme.colors.dangerSubtle : theme.colors.surfaceMuted};
  color: ${({ theme, $broken }) => ($broken ? theme.colors.dangerText : theme.colors.text)};

  dt {
    font-size: ${({ theme }) => theme.font.size.sm};
    color: inherit;
    opacity: 0.75;
    white-space: nowrap;
  }

  dd {
    display: flex;
    gap: ${({ theme }) => theme.spacing[2]};
    align-items: baseline;
    flex-wrap: wrap;
  }

  b {
    font-size: ${({ theme }) => theme.font.size.lg};
    font-weight: ${({ theme }) => theme.font.weight.bold};
    font-variant-numeric: tabular-nums;
  }
`

/** 항등식의 우변 — 값보다 흐리게 둬 결과가 먼저 읽히게 한다 */
export const Formula = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
`
