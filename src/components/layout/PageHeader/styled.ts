import styled from 'styled-components'

export const Root = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
  flex-wrap: wrap;
`

export const Title = styled.h1`
  font-size: ${({ theme }) => theme.font.size['2xl']};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text};
`

/**
 * div 다. description 은 ReactNode 라 문장 하나만 오는 게 아니다 — 주문 상세는 여기에
 * 배송일·창고 같은 항목을 dl 로 넣는다. p 안에는 블록 요소를 넣을 수 없어 브라우저가
 * 마크업을 끊고, 텍스트만 오는 경우와 렌더 결과가 달라진다.
 */
export const Description = styled.div`
  margin-top: 2px;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`
