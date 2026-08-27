import styled, { css } from 'styled-components'
import type { SummaryTone } from './types'

/**
 * 지표 줄 (KPI).
 *
 * 카드로 세운다. 이 줄은 페이지에서 홀로 서는 구획이고, 칸마다 성격이 다른 숫자가
 * 들어간다 — '재고 부족 8건' 과 '예약 완료 0건' 은 나란히 있을 뿐 이어지는 값이
 * 아니다. 테두리가 그 경계를 분명히 한다.
 *
 * 목록으로 두는 이유: 스크린리더가 '목록, 항목 7개' 로 읽어줘야 훑을 수 있다.
 */
export const Grid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: ${({ theme }) => theme.spacing[2]};
  list-style: none;
`

export const Card = styled.li`
  display: flex;
`

/**
 * 지표 한 칸. 누를 수 있으면 button, 아니면 div 로 렌더한다 —
 * 누를 수 없는 칸에 button 을 두면 키보드 탭이 아무 일도 하지 않는 곳에 멈춘다.
 *
 * 호버에 그림자를 전이하지 않는다. 그림자는 페인트를 다시 돌리므로 카드 일곱 장이
 * 늘어선 줄에서 마우스를 흘리면 그때마다 다시 그린다. 테두리 색과 transform 만 쓴다.
 */
export const Body = styled.div<{ $tone: SummaryTone; $selected: boolean; $clickable: boolean }>`
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;

  padding: ${({ theme }) => theme.spacing[3]};

  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.primarySubtle : theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme, $selected }) => ($selected ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radius.lg};
  text-align: left;
  color: inherit;

  /*
   * 포인트 지표 — '지금 이걸 하라' 하나.
   *
   * 숫자 뒤에 라임 밑줄을 깔던 자리다. 밑줄은 값에만 걸려 카드를 훑을 때는 보이지
   * 않았고, 글자와 겹쳐 숫자를 읽기도 나빴다. 카드 왼쪽에 굵은 선을 세우면 지표 줄을
   * 가로로 훑는 눈에 먼저 걸린다 — 표의 상태 레일과 같은 어휘다.
   */
  ${({ theme, $tone }) =>
    $tone === 'point' &&
    css`
      border-left: 3px solid ${theme.colors.point};
      background: ${theme.colors.pointSubtle};
    `}

  transition:
    background-color ${({ theme }) => theme.motion.hover},
    border-color ${({ theme }) => theme.motion.hover},
    transform ${({ theme }) => theme.motion.hover};

  ${({ $clickable, theme }) =>
    $clickable &&
    css`
      cursor: pointer;

      &:hover {
        border-color: ${theme.colors.primaryBorder};
        transform: translateY(-1px);
      }

      &:active {
        transform: none;
      }

      &:focus-visible {
        outline: 2px solid ${theme.colors.borderFocus};
        outline-offset: 1px;
      }

      ${theme.reducedMotion} {
        &:hover {
          transform: none;
        }
      }
    `}
`

export const Head = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
  align-items: baseline;
  max-width: 100%;
`

export const Label = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

/**
 * 다음 행동.
 *
 * 카드 바닥에 붙는다 — 담당자가 값을 읽고 나서 마지막으로 보는 줄이고, 카드 높이가
 * 제각각이어도 행동 줄끼리는 한 선에 맞아야 훑을 수 있다.
 */
export const Action = styled.span`
  display: inline-flex;
  gap: 2px;
  align-items: center;

  margin-top: auto;
  padding-top: ${({ theme }) => theme.spacing[1]};

  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.textLink};
`

/** 이 화면에서 가장 큰 글자다. 담당자가 처음 보는 숫자이므로 가장 굵게 세운다. */
export const Value = styled.span<{ $tone: SummaryTone }>`
  font-size: ${({ theme }) => theme.font.size['2xl']};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  font-variant-numeric: tabular-nums;
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  letter-spacing: ${({ theme }) => theme.font.letterSpacing.tight};
  color: ${({ theme, $tone }) =>
    $tone === 'danger'
      ? theme.colors.dangerText
      : $tone === 'warning'
        ? theme.colors.warningText
        : theme.colors.text};
`

export const Hint = styled.span`
  max-width: 100%;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textSubtle};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
