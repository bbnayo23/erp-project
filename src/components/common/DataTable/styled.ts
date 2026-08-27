import styled, { css, type DefaultTheme } from 'styled-components'
import type { ColumnAlign, RowTone } from './types'

export const Scroll = styled.div<{ $maxHeight?: string }>`
  width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;

  /*
   * 헤더 고정은 이 요소가 스크롤 컨테이너가 되어야 성립한다.
   * Panel 이 overflow:hidden 으로 모서리를 다듬고 있어 페이지 스크롤에는 붙지 않는다.
   */
  ${({ $maxHeight }) =>
    $maxHeight &&
    css`
      max-height: ${$maxHeight};
      overflow-y: auto;
    `}
`

export const Table = styled.table`
  width: 100%;
  min-width: max-content;
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.colors.text};
`

export const Th = styled.th<{ $align: ColumnAlign; $sticky: boolean; $width?: string }>`
  position: ${({ $sticky }) => ($sticky ? 'sticky' : 'static')};
  top: 0;
  /* 행보다 위에 떠 있어야 스크롤한 데이터가 머리 줄을 덮지 않는다 */
  z-index: ${({ theme, $sticky }) => ($sticky ? theme.zIndex.sticky : 'auto')};
  width: ${({ $width }) => $width ?? 'auto'};
  padding: ${({ theme }) => theme.tableCell.headPaddingY} ${({ theme }) => theme.tableCell.paddingX};
  text-align: ${({ $align }) => $align};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.textSubtle};
  letter-spacing: ${({ theme }) => theme.font.letterSpacing.wide};
  white-space: nowrap;

  /*
   * 머리 줄에는 반드시 불투명한 배경이 있어야 한다.
   *
   * stickyHeader 일 때 머리 줄은 본문 위에 떠 있다. 배경을 비우면 스크롤한 행이 글자
   * 사이로 비쳐 두 줄이 겹쳐 보인다 — 실제로 그렇게 깨졌다.
   *
   * 색은 페이지 면보다 한 단계 짙게 둔다. 띠가 있어야 어디까지가 이름표이고 어디부터
   * 데이터인지 한눈에 갈린다.
   */
  background: ${({ theme }) => theme.colors.surfaceMuted};

  /*
   * 위아래 선을 border 가 아니라 inset 그림자로 그린다.
   *
   * 표에는 border-collapse: collapse 가 걸려 있다(GlobalStyle). 이때 테두리는 셀이
   * 아니라 표의 것이 되어, 머리 줄이 sticky 로 떠 있는 동안 함께 따라오지 않고
   * 스크롤에 밀려 사라진다 — 머리 줄만 회색 띠로 덩그러니 남는다.
   * inset 그림자는 셀 자신이 그리므로 떠 있어도 남는다.
   *
   * 아래선만 두지 않는 이유: 띠가 바로 위 필터 줄과 붙어 어디서부터가 표인지 흐려진다.
   * 위아래로 닫아야 '이름표 한 줄' 로 읽힌다.
   */
  box-shadow:
    inset 0 1px 0 ${({ theme }) => theme.colors.border},
    inset 0 -1px 0 ${({ theme }) => theme.colors.border};
`

export const Td = styled.td<{ $align: ColumnAlign; $numeric?: boolean }>`
  /*
   * 행 높이를 정하는 값이다. 세로 패딩 6px + 본문 12px 로 한 줄 행이 약 29px 이 된다.
   * line-height 를 snug 로 조이지 않으면 패딩만 줄여도 행이 얇아지지 않는다.
   */
  padding: ${({ theme }) => theme.tableCell.paddingY} ${({ theme }) => theme.tableCell.paddingX};
  line-height: ${({ theme }) => theme.font.lineHeight.snug};
  text-align: ${({ $align }) => $align};
  border-bottom: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme }) => theme.colors.border};
  vertical-align: middle;

  ${({ theme, $numeric }) =>
    $numeric &&
    css`
      font-variant-numeric: tabular-nums;
      font-feature-settings: 'tnum';
      /* 표에서 담당자가 실제로 비교하는 값이다. 글자보다 한 단계 굵게 세운다 */
      font-weight: ${theme.font.weight.semibold};
    `}
`

const railColor = (theme: DefaultTheme, tone: RowTone): string =>
  ({
    neutral: theme.colors.borderStrong,
    primary: theme.colors.primary,
    point: theme.colors.point,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    info: theme.colors.info,
  })[tone]

export const Tr = styled.tr<{ $clickable: boolean; $selected: boolean; $tone?: RowTone }>`
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.surfaceSelected : theme.colors.surface};

  /*
   * 배경색만 전이한다.
   *
   * 행에 transform 을 걸면 26줄짜리 표에서 마우스를 훑을 때마다 합성 레이어가 그만큼
   * 만들어졌다 사라진다. 표는 카드와 달리 '떠오를' 필요가 없다 — 어느 줄에 있는지만
   * 알면 된다.
   */
  transition: background-color ${({ theme }) => theme.motion.hover};

  /*
   * 상태 레일. box-shadow 로 그리는 이유는 첫 셀에 border-left 를 주면 셀 안쪽
   * 패딩이 밀려 컬럼 정렬이 행마다 어긋나기 때문이다.
   */
  ${({ theme, $tone }) =>
    $tone &&
    css`
      > td:first-child {
        box-shadow: inset 3px 0 0 ${railColor(theme, $tone)};
      }
    `}

  ${({ $clickable, theme, $selected }) =>
    $clickable &&
    css`
      cursor: pointer;

      &:hover {
        background: ${$selected ? theme.colors.surfaceSelected : theme.colors.surfaceHover};
      }

      /* 행이 이동 수단이므로 키보드로도 닿아야 한다 */
      &:focus-visible {
        outline: 2px solid ${theme.colors.borderFocus};
        outline-offset: -2px;
      }
    `}

  &:last-child td {
    border-bottom: 0;
  }
`

export const StateCell = styled.td`
  padding: 0;
`
