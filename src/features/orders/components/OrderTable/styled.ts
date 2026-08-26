import styled from 'styled-components'

export const Code = styled.span`
  font-family: ${({ theme }) => theme.font.family.mono};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textLink};
`

export const Customer = styled.span`
  font-weight: ${({ theme }) => theme.font.weight.medium};
`

export const DueCell = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`

export const Muted = styled.span`
  color: ${({ theme }) => theme.colors.textSubtle};
  font-size: ${({ theme }) => theme.font.size.xs};
`
