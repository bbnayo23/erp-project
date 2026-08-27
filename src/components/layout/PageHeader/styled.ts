import styled from 'styled-components'

/**
 * 아래 여백을 갖지 않는다. 페이지 Layout 이 flex gap 으로 간격을 주는데 여기서
 * margin-bottom 까지 얹으면 gap + margin 이 더해져 두 배로 벌어진다.
 * 형제 간 간격은 부모가 정한다.
 */
export const Root = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
  flex-wrap: wrap;
`

/** 제목 블록. min-width:0 이 없으면 긴 설명이 줄바꿈되지 않고 액션을 밀어낸다. */
export const TitleGroup = styled.div`
  flex: 1 1 420px;
  min-width: 0;
`

export const Title = styled.h1`
  font-size: ${({ theme }) => theme.font.size['3xl']};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  letter-spacing: ${({ theme }) => theme.font.letterSpacing.tight};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
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
