import styled from 'styled-components'

/**
 * 앱 셸.
 *
 * 화면 전체가 스크롤되지 않는다. 셸이 뷰포트 높이에 고정되고 그 안의 본문만 굴러간다 —
 * 이렇게 해야 GNB 가 항상 제자리에 있고, 표의 고정 머리 줄도 본문 스크롤을 기준으로
 * 붙는다. 문서를 통째로 굴리면 두 스크롤(문서 · 표)이 겹쳐 어느 쪽이 움직이는지
 * 알 수 없다.
 *
 * `dvh` 를 쓰는 이유: 모바일 브라우저의 주소창이 접히고 펴질 때 `vh` 는 갱신되지 않아
 * 화면 아래가 잘린다.
 */
export const Shell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
`

/**
 * 본문 여백.
 *
 * 24px 에서 16px 로 내렸다. 화면 좌우로 16px 씩 총 32px 을 돌려받으면 표에서 컬럼
 * 하나가 더 들어간다 — 이 앱은 한 화면에 얼마나 담기느냐가 곧 사용성이다.
 * 세로는 조금 더 준다. 위아래가 좁으면 카드가 GNB 에 붙어 보인다.
 */
export const Content = styled.main`
  /* min-height: 0 이 없으면 flex 아이템이 내용 높이만큼 부풀어 셸 밖으로 넘친다 */
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;

  width: 100%;
`

/**
 * 본문의 내용 폭.
 *
 * 최대 폭과 여백을 스크롤 컨테이너가 아니라 그 안쪽이 맡는다. 컨테이너에 걸면
 * 스크롤바가 내용과 함께 가운데로 딸려 들어와 화면 오른쪽 끝이 아니라 엉뚱한 자리에
 * 생긴다.
 */
export const Inner = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin-inline: auto;
  padding: ${({ theme }) => theme.spacing[5]} ${({ theme }) => theme.spacing[4]};

  ${({ theme }) => theme.media.maxMd} {
    padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[3]};
  }
`
