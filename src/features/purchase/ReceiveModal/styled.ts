import styled from 'styled-components'

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`

/** 문서의 고정값 — 담당자가 바꿀 수 없는 것들 */
export const Facts = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
  gap: ${({ theme }) => theme.spacing[2]};

  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceMuted};

  dt {
    font-size: ${({ theme }) => theme.font.size.sm};
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    font-weight: ${({ theme }) => theme.font.weight.semibold};
    font-variant-numeric: tabular-nums;
  }
`

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`

/**
 * 단계 제목.
 *
 * 생산의뢰는 ① 검사 → ② 입고 두 단계다. 번호를 붙이는 이유는 순서가 규칙이기
 * 때문이다 — 검사 없이 입고할 수 없다는 것을 화면이 먼저 말해야 한다.
 */
export const StepTitle = styled.h3`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: baseline;

  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.bold};
`

export const StepHint = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Field = styled.label`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;

  font-size: ${({ theme }) => theme.font.size.md};

  input {
    width: 88px;
  }
`

export const Row = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-wrap: wrap;
  align-items: center;
`

/** 개체번호 입력 — 수량만큼 줄이 선다 */
export const SerialList = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing[2]};
  list-style: none;
`

export const Problem = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.dangerText};
`

export const Notice = styled.p`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.infoSubtle};
  color: ${({ theme }) => theme.colors.infoText};
  font-size: ${({ theme }) => theme.font.size.sm};
`
