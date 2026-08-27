import styled, { css } from 'styled-components'
import type { SummaryTone } from './types'

/** 지표 묶음은 목록이다 — 스크린리더가 '목록, 항목 5개' 로 읽어줘야 훑을 수 있다 */
export const Grid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.spacing[3]};
  list-style: none;
`

export const Card = styled.li`
  display: flex;
`

/**
 * 카드 본체. 누를 수 있으면 button, 아니면 div 로 렌더한다 —
 * 누를 수 없는 카드에 button 을 두면 키보드 탭이 아무 일도 하지 않는 곳에 멈춘다.
 */
export const Body = styled.div<{ $tone: SummaryTone; $selected: boolean; $clickable: boolean }>`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.primarySubtle : theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme, $selected }) => ($selected ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radius.lg};
  text-align: left;
  transition:
    background-color ${({ theme }) => theme.duration.fast},
    border-color ${({ theme }) => theme.duration.fast};

  ${({ $clickable, theme }) =>
    $clickable &&
    css`
      cursor: pointer;

      &:hover {
        border-color: ${theme.colors.borderStrong};
        background: ${theme.colors.surfaceHover};
      }

      &:focus-visible {
        outline: 2px solid ${theme.colors.borderFocus};
        outline-offset: 2px;
      }
    `}
`

export const Label = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Value = styled.span<{ $tone: SummaryTone }>`
  font-size: ${({ theme }) => theme.font.size['2xl']};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  font-variant-numeric: tabular-nums;
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  color: ${({ theme, $tone }) =>
    $tone === 'danger'
      ? theme.colors.dangerText
      : $tone === 'warning'
        ? theme.colors.warningText
        : theme.colors.text};
`

/**
 * 포인트 지표 — '지금 이걸 하라' 하나에만 쓴다.
 * 라임은 글자색으로 쓸 대비가 없어 숫자 뒤에 밑줄 형태의 배경으로 깐다.
 */
export const PointMark = styled.span`
  display: inline-block;
  padding-inline: ${({ theme }) => theme.spacing[1]};
  background: linear-gradient(
    to top,
    ${({ theme }) => theme.colors.point} 0.36em,
    transparent 0.36em
  );
`

export const Hint = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.textSubtle};
`
