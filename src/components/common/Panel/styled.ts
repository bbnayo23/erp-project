import styled, { css } from 'styled-components'
import type { PanelTone } from './types'

/**
 * 구획.
 *
 * 카드를 두를지 말지는 **그 구획이 페이지에서 홀로 서는가** 로 정한다.
 *
 * 페이지 바로 아래에 놓이는 구획은 카드다 — 테두리가 없으면 표가 어디서 시작해 어디서
 * 끝나는지 배경만으로는 알 수 없다. 반대로 이미 카드 안에 들어 있는 구획까지 테두리를
 * 두르면 카드 속의 카드가 되어, 어느 면이 위인지 판단이 들어가고 모서리마다 여백이
 * 생긴다. 그럴 때는 선 하나로 나눈다.
 */
export const Root = styled.section<{ $tone: PanelTone; $divided: boolean }>`
  ${({ theme, $tone, $divided }) => {
    if ($tone === 'focus') {
      return css`
        border-radius: ${theme.radius.lg};
        background: ${theme.colors.focusSurface};
        color: ${theme.colors.focusText};
        overflow: hidden;
      `
    }

    if ($tone === 'plain') {
      return (
        $divided &&
        css`
          border-top: ${theme.borderWidth.thin} solid ${theme.colors.border};

          /* 카드 안의 첫 구획에는 나눌 것이 없다 */
          &:first-of-type {
            border-top: 0;
          }
        `
      )
    }

    return css`
      background: ${theme.colors.surface};
      border: ${theme.borderWidth.thin} solid ${theme.colors.border};
      border-radius: ${theme.radius.xl};
      /* 페이지 위에 놓인 면임을 밝힌다 — 테두리만으로는 배경과 붙어 보인다 */
      box-shadow: ${theme.shadow.sm};
      /* 표의 모서리가 테두리 밖으로 삐져나오지 않게 한다 */
      overflow: hidden;
    `
  }}
`

/**
 * 구획 머리말. **모든 구획이 같은 여백을 갖는 단 한 곳이다.**
 *
 * 좌우 여백을 표 셀에 맞춘다. 제목이 표의 첫 글자와 다른 세로선에서 시작하면 구획
 * 전체가 삐뚤어 보인다 — 카드 안에서 이 정렬이 유일한 기준선이다.
 *
 * 아래 여백이 제목과 표 사이의 간격이 된다. 표는 자기 위쪽에 여백을 두지 않는다 —
 * 두 쪽이 모두 여백을 주면 제목이 표에서 멀어져 어느 표의 제목인지 흐려진다.
 */
export const Head = styled.div<{ $tone: PanelTone }>`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  align-items: baseline;
  justify-content: space-between;

  padding: ${({ theme }) => theme.spacing[3]}
    ${({ theme, $tone }) => ($tone === 'focus' ? theme.spacing[4] : theme.tableCell.paddingX)}
    ${({ theme }) => theme.spacing[2]};
`

export const HeadText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

/** 구획 제목은 화면에서 두 번째로 굵다 — 첫째는 페이지 제목이다 */
export const Title = styled.h2`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  letter-spacing: ${({ theme }) => theme.font.letterSpacing.tight};
  line-height: ${({ theme }) => theme.font.lineHeight.snug};
`

export const Description = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: ${({ theme }) => theme.font.lineHeight.normal};
`

export const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;
  flex-shrink: 0;
`

/**
 * 필터 줄.
 *
 * 머리말이 없는 구획에서는 이 줄이 카드의 첫 내용이다. 위 여백이 없으면 셀렉트가
 * 테두리에 붙어 눌리는 자리처럼 보이지 않는다.
 */
export const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-wrap: wrap;

  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.tableCell.paddingX};
`

/**
 * 표가 아닌 내용을 감싼다.
 *
 * 머리말이 있으면 위쪽 여백은 머리말이 이미 냈으므로 다시 주지 않는다.
 * 좌우는 표와 같은 선에서 시작해야 한다 — 표의 첫 글자와 어긋나면 구획이 삐뚤어 보인다.
 */
export const Body = styled.div<{ $hasHead: boolean; $tone: PanelTone }>`
  padding: ${({ theme, $tone }) =>
    $tone === 'focus' ? theme.spacing[4] : `0 ${theme.tableCell.paddingX}`};
  padding-bottom: ${({ theme }) => theme.spacing[3]};

  ${({ $hasHead, theme, $tone }) =>
    !$hasHead &&
    $tone !== 'focus' &&
    css`
      padding-top: ${theme.spacing[3]};
    `}
`
