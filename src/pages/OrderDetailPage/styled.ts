import styled from 'styled-components'
import { pageEnter } from '@/styles/animations'

export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  /* 카드끼리는 떨어져 서야 각자의 테두리가 경계로 읽힌다 */
  gap: ${({ theme }) => theme.spacing[3]};

  ${pageEnter}
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

/** 여백은 Panel 의 Body 가 낸다 — 여기서 다시 주면 카드마다 안쪽 여백이 갈린다 */
export const Blocks = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
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

/**
 * 목록 레일 + 상세 두 칸. **이 요소가 카드다.**
 *
 * 상세로 들어오면 목록이 사라져 담당자는 '내가 몇 번째 주문을 보고 있는지' 와 '다음에
 * 볼 주문이 무엇인지' 를 잃는다. 배정 순서가 곧 업무 순서인 화면이라 그 손실이 크다.
 *
 * **두 칸을 각각 카드로 두지 않는다.** 그러면 왼쪽 상자의 아래 끝과 오른쪽 상자의 아래
 * 끝이 서로 다른 자리에서 끝나 화면이 어긋나 보인다 — 두 칸의 높이는 애초에 다른 것이
 * 정한다(레일은 주문 수, 상세는 품목 수). 바깥을 카드 하나로 두르고 안을 세로선으로
 * 나누면, 아래 끝은 카드의 것 하나뿐이라 항상 맞아떨어진다.
 *
 * `stretch` 가 그 전제다 — 기본값인 `start` 로 두면 세로선이 중간에서 끊긴다.
 */
export const Split = styled.div`
  display: grid;
  align-items: stretch;
  grid-template-columns: 1fr;

  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  /* 목록에서 한 건을 열어 올라온 면이다 — 그림자가 그 깊이를 말한다 */
  box-shadow: ${({ theme }) => theme.shadow.sm};
  /*
   * hidden 이 아니라 clip 이다.
   *
   * overflow: hidden 은 스크롤 컨테이너를 만들어 안쪽 레일의 position: sticky 를
   * 무력화한다 — 레일이 뷰포트가 아니라 이 카드를 기준으로 붙어, 스크롤해도 따라오지
   * 않는다. clip 은 스크롤 컨테이너를 만들지 않으면서 모서리만 다듬는다.
   */
  overflow: clip;

  ${({ theme }) => theme.media.md} {
    grid-template-columns: 200px minmax(0, 1fr);
  }
`

/**
 * 레일 칸.
 *
 * 이 요소는 자리와 선만 갖는다. 안의 카드 목록은 스크롤을 따라와야 하므로 sticky 인
 * 자식이 따로 있다 — sticky 를 이 요소에 걸면 grid 의 stretch 가 풀려 세로선이
 * 카드 목록 높이에서 끊긴다.
 */
/**
 * 레일 칸.
 *
 * 선 하나로만 나누면 좌우가 같은 종이 위의 두 덩어리로 읽혀 경계가 약하다. 옅은 면을
 * 깔면 '목록 자리' 와 '상세 자리' 가 성격이 다른 영역임이 바로 보인다.
 *
 * 이 요소는 자리와 면만 갖는다. 안의 목록은 스크롤을 따라와야 하므로 sticky 인 자식이
 * 따로 있다 — sticky 를 이 요소에 걸면 grid 의 stretch 가 풀려 세로선이 중간에서 끊긴다.
 */
export const RailColumn = styled.nav`
  padding: ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.surfaceMuted};

  ${({ theme }) => theme.media.md} {
    border-right: ${({ theme }) => theme.borderWidth.thin} solid
      ${({ theme }) => theme.colors.border};
  }

  ${({ theme }) => theme.media.maxMd} {
    border-bottom: ${({ theme }) => theme.borderWidth.thin} solid
      ${({ theme }) => theme.colors.border};
  }
`

export const RailSticky = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;

  ${({ theme }) => theme.media.maxMd} {
    flex-direction: row;
    overflow-x: auto;
    overscroll-behavior-x: contain;
  }

  ${({ theme }) => theme.media.md} {
    position: sticky;
    /*
     * 기준은 본문 스크롤 영역의 위 끝이다 — GNB 는 그 영역 밖에 고정돼 있으므로
     * 높이를 더해줄 필요가 없다.
     */
    top: 0;
    /*
     * 스크롤 영역이 화면 아래 끝까지 내려가야 한다. 본문이 쓸 수 있는 높이는
     * 화면에서 GNB 와 본문 위아래 여백을 뺀 만큼이다 — 여유를 더 잡으면 목록이
     * 중간에서 끊겨, 아래에 빈자리를 두고 스크롤바만 짧게 남는다.
     */
    max-height: calc(
      100dvh - ${({ theme }) => theme.layout.gnbHeight} - ${({ theme }) => theme.spacing[10]}
    );
    overflow-y: auto;
  }
`

export const RailHead = styled.p`
  flex-shrink: 0;
  display: flex;
  align-items: center;

  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.tableCell.paddingX};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.textSubtle};
  letter-spacing: ${({ theme }) => theme.font.letterSpacing.wide};
  white-space: nowrap;
`

/**
 * 주문 한 줄.
 *
 * 카드가 아니라 표의 행처럼 다룬다. 왼쪽 굵은 선이 현재 주문을 짚고, 배경은 선택된
 * 줄에만 깔린다 — 줄마다 테두리를 두르면 레일이 다시 상자밭이 된다.
 */
export const RailCard = styled.button<{ $current: boolean }>`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  align-items: flex-start;

  width: 100%;
  padding: ${({ theme }) => theme.tableCell.paddingY} ${({ theme }) => theme.tableCell.paddingX};

  border: 0;
  border-left: ${({ theme }) => theme.borderWidth.thick} solid
    ${({ theme, $current }) => ($current ? theme.colors.primary : 'transparent')};
  border-radius: ${({ theme }) => theme.radius.xs};

  /* 옅은 면 위에 서므로 선택된 줄이 흰 면으로 떠오른다 — 목록에서와 반대다 */
  background: ${({ theme, $current }) => ($current ? theme.colors.surface : 'transparent')};
  color: inherit;
  text-align: left;
  cursor: pointer;

  transition: background-color ${({ theme }) => theme.motion.hover};

  &:hover {
    background: ${({ theme, $current }) =>
      $current ? theme.colors.surface : theme.colors.surfaceHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.borderFocus};
    outline-offset: -2px;
  }

  ${({ theme }) => theme.media.maxMd} {
    width: auto;
    min-width: 128px;
  }
`

export const RailLine = styled.span`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
  align-items: baseline;

  font-size: ${({ theme }) => theme.font.size.md};
  /* 주문번호는 레일에서 유일하게 식별에 쓰이는 값이다 */
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  white-space: nowrap;
`

export const RailMeta = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
`

/** 좁은 화면에서는 줄이 한 줄이어야 해 배지를 숨긴다 */
export const RailBadge = styled.span`
  ${({ theme }) => theme.media.maxMd} {
    display: none;
  }
`

/**
 * 상세 칸.
 *
 * 좌우 여백을 표 셀에 맞춘다 — 구획 제목과 표의 첫 글자가 같은 세로선에서 시작해야
 * 하는데, 여기서 여백을 또 주면 그 정렬이 두 번 밀린다. 위아래만 카드 안쪽 숨통으로
 * 낸다.
 */
export const Main = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;

  padding-block: ${({ theme }) => theme.spacing[3]};
`
