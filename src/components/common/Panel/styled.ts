import styled from 'styled-components'

export const Root = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
`

export const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-wrap: wrap;
  padding: ${({ theme }) => theme.spacing[4]};
  border-bottom: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme }) => theme.colors.border};
`
