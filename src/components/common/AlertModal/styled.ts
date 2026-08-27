import styled, { css } from 'styled-components'
import type { AlertTone } from './types'

export const Panel = styled.div`
  width: min(420px, calc(100vw - ${({ theme }) => theme.spacing[8]}));
  padding: ${({ theme }) => theme.spacing[6]};

  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.lg};
`

export const Head = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  align-items: flex-start;
`

/**
 * 세모 느낌표.
 *
 * 원형 배경을 깔아 아이콘이 글자 옆에서 흩어지지 않게 한다. 색은 tone 이 정한다 —
 * 빨강은 '값을 버린다', 주황은 '확인이 필요하다' 다.
 */
export const IconSlot = styled.span<{ $tone: AlertTone }>`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.full};

  ${({ theme, $tone }) =>
    $tone === 'danger'
      ? css`
          background: ${theme.colors.dangerSubtle};
          color: ${theme.colors.danger};
        `
      : css`
          background: ${theme.colors.warningSubtle};
          color: ${theme.colors.warning};
        `}
`

export const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  min-width: 0;
`

export const Title = styled.h2`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  line-height: ${({ theme }) => theme.font.lineHeight.snug};
`

export const Description = styled.p`
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: ${({ theme }) => theme.font.lineHeight.normal};
`

/**
 * 버튼 순서 — 머무르기가 왼쪽, 진행이 오른쪽.
 *
 * 오른쪽 끝이 눌리기 쉬운 자리인데 이 창은 '진행' 이 잃는 쪽이다. 그래서 진행 버튼은
 * primary 가 아니라 danger 로 그린다. 색이 곧 경고다.
 */
export const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  justify-content: flex-end;
  padding-top: ${({ theme }) => theme.spacing[5]};
`
