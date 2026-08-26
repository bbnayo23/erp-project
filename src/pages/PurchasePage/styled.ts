import styled from 'styled-components'

export const SectionHeader = styled.div`
  margin: ${({ theme }) => theme.spacing[8]} 0 ${({ theme }) => theme.spacing[3]};
`

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

export const SectionNote = styled.p`
  margin-top: 2px;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`
