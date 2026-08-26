import styled from 'styled-components'

export const ItemCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

export const ItemName = styled.span`
  font-weight: ${({ theme }) => theme.font.weight.medium};
`

export const ItemCode = styled.span`
  font-family: ${({ theme }) => theme.font.family.mono};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.textSubtle};
`

export const Muted = styled.span`
  color: ${({ theme }) => theme.colors.textSubtle};
`

export const Shortfall = styled.span`
  color: ${({ theme }) => theme.colors.dangerText};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`
