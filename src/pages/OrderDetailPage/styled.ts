import styled from 'styled-components'

export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-wrap: wrap;
`

export const Summary = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`

/** 주문 머리 정보 — 배송일·창고처럼 라벨과 값이 붙어 다니는 항목들 */
export const Meta = styled.dl`
  display: flex;
  gap: ${({ theme }) => theme.spacing[5]};
  flex-wrap: wrap;
  align-items: baseline;

  div {
    display: flex;
    gap: ${({ theme }) => theme.spacing[2]};
    align-items: baseline;
  }

  dt {
    font-size: ${({ theme }) => theme.font.size.sm};
    color: ${({ theme }) => theme.colors.textSubtle};
  }

  dd {
    font-weight: ${({ theme }) => theme.font.weight.medium};
    font-variant-numeric: tabular-nums;
  }
`

export const Overdue = styled.span`
  color: ${({ theme }) => theme.colors.dangerText};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

export const SectionTitle = styled.h2`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[4]} 0;
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

export const SectionHint = styled.p`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[4]}
    ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Blocks = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[4]};
  list-style: none;

  li {
    display: flex;
    gap: ${({ theme }) => theme.spacing[2]};
    font-size: ${({ theme }) => theme.font.size.md};
  }
`

export const StatusCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  align-items: flex-start;
`

export const Note = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

/** 입고 수량 입력 + 버튼을 한 줄에 */
export const ReceiveControl = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;
  justify-content: flex-end;

  input {
    width: 72px;
  }
`

export const Muted = styled.span`
  color: ${({ theme }) => theme.colors.textSubtle};
`
