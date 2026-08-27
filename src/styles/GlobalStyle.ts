import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    height: 100%;
  }

  /*
   * 네이티브 컨트롤에 테마를 알려준다.
   * 이게 없으면 다크 모드에서 select 의 옵션 목록·날짜 피커·autofill 배경·기본
   * 스크롤바가 라이트로 렌더된다 — 앱은 어두운데 드롭다운만 흰 상태가 된다.
   */
  html {
    color-scheme: ${({ theme }) => (theme.mode === 'dark' ? 'dark' : 'light')};
  }

  body {
    margin: 0;
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.font.family.sans};
    font-size: ${({ theme }) => theme.font.size.md};
    line-height: ${({ theme }) => theme.font.lineHeight.normal};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  h1, h2, h3, h4, h5, h6, p, figure, blockquote, dl, dd {
    margin: 0;
  }

  ul, ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  a {
    color: ${({ theme }) => theme.colors.textLink};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
    color: inherit;
  }

  /* 체크박스·라디오·진행률 등 네이티브 위젯의 강조색 */
  input[type='checkbox'],
  input[type='radio'] {
    accent-color: ${({ theme }) => theme.colors.primary};
  }

  button {
    cursor: pointer;
  }

  img,
  svg,
  video {
    display: block;
    max-width: 100%;
  }

  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.borderFocus};
    outline-offset: 2px;
  }

  /* 스크롤바 — ERP 처럼 표가 많은 화면에서 존재감을 줄인다 */
  * {
    scrollbar-width: thin;
    scrollbar-color: ${({ theme }) => theme.colors.borderStrong} transparent;
  }

  *::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  *::-webkit-scrollbar-track {
    background: transparent;
  }

  *::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.colors.borderStrong};
    border: 3px solid transparent;
    border-radius: ${({ theme }) => theme.radius.full};
    background-clip: content-box;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`
