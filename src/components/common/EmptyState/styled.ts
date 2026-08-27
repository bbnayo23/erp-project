import styled from 'styled-components'

export const Root = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[6]};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Title = styled.p`
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text};
`

export const Description = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  max-width: 380px;
`

/** Root 의 gap 8px 에 이만큼만 더한다 — 문구와 버튼 사이는 한 단계 넓어야 한다 */
export const Actions = styled.div`
  margin-top: ${({ theme }) => theme.spacing[2]};
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`
