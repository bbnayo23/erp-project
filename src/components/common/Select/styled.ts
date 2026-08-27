import styled from 'styled-components'

/**
 * 셀렉트는 감싼다.
 *
 * `appearance: none` 으로 네이티브 화살표를 지웠으므로 우리가 하나 그려 넣어야 하고,
 * `styled.ts` 는 JSX 를 담을 수 없어 아이콘을 절대 배치할 기준 박스가 필요하다.
 */
export const Root = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  /* 필터 바의 셀렉트들이 서로 다른 폭으로 들쭉날쭉하지 않게 한다 */
  min-width: 148px;
  max-width: 220px;
`

export const Field = styled.select`
  /*
   * 네이티브 렌더링을 끈다. 이게 없으면 브라우저가 자기 컨트롤을 그리면서
   * border-radius · color · height 를 부분적으로만 반영한다 — 플랫폼마다 모서리와
   * 글자색이 달라지고, 화살표가 두 개로 보이기도 한다.
   */
  appearance: none;
  -webkit-appearance: none;

  width: 100%;
  height: ${({ theme }) => theme.controlHeight.md};
  /* 오른쪽은 화살표 자리를 비운다 — 긴 옵션 글자가 화살표 밑으로 들어가면 안 된다 */
  padding: 0 ${({ theme }) => theme.spacing[8]} 0 ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surface};
  /* 상속에 기대지 않는다 — autofill·네이티브 스타일이 끼면 배경만 바뀌고 글자는 남는다 */
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.font.size.md};
  /* 고정 높이 안에서 글자를 수직 중앙에 두려면 줄높이를 상속받지 않아야 한다 */
  line-height: 1;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.duration.fast}
    ${({ theme }) => theme.easing.standard};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.borderFocus};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.surfaceDisabled};
    color: ${({ theme }) => theme.colors.textDisabled};
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: none;
    border-color: ${({ theme }) => theme.colors.borderFocus};
    box-shadow: ${({ theme }) => theme.shadow.focus};
  }

  /*
   * 옵션 목록은 OS 가 그린다. 다크 모드에서 목록만 흰 배경으로 뜨는 것은
   * GlobalStyle 의 color-scheme 이 막아 주지만, 배경색은 여기서 한 번 더 못박는다.
   */
  option {
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
  }
`

/** 직접 그린 화살표. currentColor 를 따르므로 테마가 바뀌면 같이 바뀐다. */
export const Arrow = styled.span`
  position: absolute;
  right: ${({ theme }) => theme.spacing[3]};
  display: flex;
  color: ${({ theme }) => theme.colors.textSubtle};
  /* 화살표를 눌러도 셀렉트가 열려야 한다 */
  pointer-events: none;
`
