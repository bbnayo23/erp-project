import styled from 'styled-components'

export const Meta = styled.dl`
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  font-size: ${({ theme }) => theme.font.size.md};
`

export const Label = styled.dt`
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Value = styled.dd`
  color: ${({ theme }) => theme.colors.text};
`

export const Section = styled.section`
  & + & {
    margin-top: ${({ theme }) => theme.spacing[6]};
  }
`

export const SectionTitle = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

export const SectionNote = styled.p`
  margin: -${({ theme }) => theme.spacing[2]} 0 ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Bordered = styled.div`
  border: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
`

export const Shortfall = styled.span`
  color: ${({ theme }) => theme.colors.dangerText};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

export const Muted = styled.span`
  color: ${({ theme }) => theme.colors.textSubtle};
`
