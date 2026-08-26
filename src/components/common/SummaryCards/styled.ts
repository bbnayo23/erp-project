import styled from 'styled-components'
import type { SummaryTone } from './types'

/** 지표 묶음은 목록이다 — 스크린리더가 '목록, 항목 5개' 로 읽어줘야 훑을 수 있다 */
export const Grid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
  list-style: none;
`

export const Card = styled.li`
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
`

export const Label = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Value = styled.p<{ $tone: SummaryTone }>`
  margin-top: ${({ theme }) => theme.spacing[1]};
  font-size: ${({ theme }) => theme.font.size['2xl']};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $tone }) =>
    $tone === 'danger'
      ? theme.colors.dangerText
      : $tone === 'warning'
        ? theme.colors.warningText
        : theme.colors.text};
`

export const Hint = styled.p`
  margin-top: 2px;
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.textSubtle};
`
