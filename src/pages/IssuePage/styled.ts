import styled from 'styled-components'
import { pageEnter } from '@/styles/animations'

export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};

  ${pageEnter}
`

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  max-width: 560px;
`

/**
 * 규칙이 정한 값.
 *
 * 입력으로 두지 않는 이유를 값 아래에 적는다 — 담당자가 '왜 못 고치지' 에서 막히면
 * 규칙을 우회할 길을 찾게 된다.
 */
export const Facts = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(148px, 1fr));
  gap: ${({ theme }) => theme.spacing[3]};

  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceMuted};

  dt {
    font-size: ${({ theme }) => theme.font.size.sm};
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-weight: ${({ theme }) => theme.font.weight.semibold};
  }
`

/** 바꿀 수 없는 값의 근거 · 입력 옆 보조 문구 */
export const Fixed = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.regular};
  color: ${({ theme }) => theme.colors.textSubtle};
`

export const Field = styled.label`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;
  flex-wrap: wrap;

  > span:first-child {
    width: 104px;
    flex-shrink: 0;
    font-size: ${({ theme }) => theme.font.size.md};
    color: ${({ theme }) => theme.colors.textMuted};
  }

  input,
  select {
    width: 200px;
  }
`

export const Notice = styled.p`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.infoSubtle};
  color: ${({ theme }) => theme.colors.infoText};
  font-size: ${({ theme }) => theme.font.size.sm};
`

export const Problem = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.dangerText};
`

export const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  justify-content: flex-end;
  padding-top: ${({ theme }) => theme.spacing[2]};
`
