import styled, { css, keyframes, type DefaultTheme } from 'styled-components'
import type { ToastTone } from './types'

const appear = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
`

/**
 * 화면 상단 가운데. 딤을 깔지 않아 뒤 화면이 그대로 보인다.
 *
 * 가운데 정렬을 고른 이유: 담당자의 시선은 방금 누른 버튼 근처에 있는데, 이 앱의 액션
 * 버튼은 머리말(주문 상세) · 행 오른쪽(발주 현황) · 서랍 안으로 흩어져 있다. 구석에
 * 띄우면 어디를 봐야 할지 화면마다 달라진다.
 *
 * 정중앙이 아니라 위쪽에 둔다. 화면 한복판은 표의 한가운데라, 토스트가 방금 처리한
 * 행을 덮어 결과를 확인하려는 눈을 가린다. GNB 아래에 걸면 표를 가리지 않는다.
 *
 * pointer-events 를 끄는 것이 중요하다. 위를 가리는 층이 클릭을 먹으면 토스트가 떠
 * 있는 동안 그 아래를 누를 수 없다 — 닫기 버튼만 클릭을 되살린다.
 */
export const Viewport = styled.div`
  position: fixed;
  top: calc(${({ theme }) => theme.layout.gnbHeight} + ${({ theme }) => theme.spacing[3]});
  left: 50%;
  transform: translateX(-50%);
  z-index: ${({ theme }) => theme.zIndex.toast};

  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;

  width: max-content;
  max-width: min(90vw, 420px);
  pointer-events: none;
`

const toneStyle = (theme: DefaultTheme, tone: ToastTone) =>
  ({
    success: css`
      background: ${theme.colors.successSubtle};
      border-color: ${theme.colors.success};
      color: ${theme.colors.successText};
    `,
    danger: css`
      background: ${theme.colors.dangerSubtle};
      border-color: ${theme.colors.danger};
      color: ${theme.colors.dangerText};
    `,
    info: css`
      background: ${theme.colors.surface};
      border-color: ${theme.colors.borderStrong};
      color: ${theme.colors.text};
    `,
  })[tone]

export const Item = styled.div<{ $tone: ToastTone }>`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: flex-start;

  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};

  border: ${({ theme }) => theme.borderWidth.thin} solid;
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => theme.shadow.lg};

  pointer-events: auto;
  animation: ${appear} ${({ theme }) => theme.duration.fast} ${({ theme }) => theme.easing.entrance};

  ${({ theme, $tone }) => toneStyle(theme, $tone)}
`

export const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  min-width: 0;
`

export const Message = styled.strong`
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

/** 무엇이 어떻게 바뀌었는지 — 본문보다 한 단계 흐리게 */
export const Description = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  opacity: 0.85;
`

export const Close = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 18px;
  height: 18px;
  padding: 0;

  border: 0;
  border-radius: ${({ theme }) => theme.radius.xs};
  background: transparent;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;

  &:hover {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.borderFocus};
    outline-offset: 1px;
  }
`
