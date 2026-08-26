import styled from 'styled-components'

export const Code = styled.span`
  font-family: ${({ theme }) => theme.font.family.mono};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textLink};
`

export const ProgressCell = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  min-width: 140px;
`

export const Track = styled.div`
  flex: 1;
  height: 6px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  overflow: hidden;
`

export const Fill = styled.div<{ $ratio: number }>`
  width: ${({ $ratio }) => `${Math.round($ratio * 100)}%`};
  height: 100%;
  background: ${({ theme }) => theme.colors.primary};
`

export const ProgressLabel = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`

export const DateCell = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`
