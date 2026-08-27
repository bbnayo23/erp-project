/**
 * Primitive design tokens — raw values only.
 * 의미(semantic)는 theme 레이어에서 부여한다. 컴포넌트에서 palette 를 직접 쓰지 말 것.
 */

export const palette = {
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  /**
   * 중립색. 순수 무채색이 아니라 남색 쪽으로 기울여 두었다 —
   * 브랜드 색을 primary 한 곳에만 쓰면 화면 대부분(배경·테두리·본문)이 브랜드와
   * 무관한 회색으로 남는다. 중립색에 같은 기미를 넣어야 전체가 한 톤으로 읽힌다.
   */
  slate: {
    25: '#fbfcfe',
    50: '#f7f9fc',
    100: '#eff2f8',
    200: '#dfe4ef',
    300: '#c6cee0',
    400: '#8e9ab6',
    500: '#63708f',
    600: '#475574',
    700: '#333f5c',
    800: '#1f2942',
    900: '#141c30',
    950: '#0c1120',
  },

  /** 브랜드 남색 — primary. 600 이 로고 색 자리다. */
  navy: {
    25: '#f6f8fd',
    50: '#eef2fb',
    100: '#d8e1f6',
    200: '#b4c4ec',
    300: '#7f97d8',
    400: '#4a68b6',
    500: '#2a4693',
    600: '#16306b',
    700: '#112657',
    800: '#0d1d43',
    900: '#091634',
  },

  /**
   * 포인트 색 — 라임. 흰 배경에서 텍스트로 쓰면 대비가 모자라므로
   * 배경·마커로만 쓰고 그 위에 남색 글자를 올린다 (onLime).
   */
  lime: {
    25: '#fbfee8',
    50: '#f6fdcd',
    100: '#edfba6',
    200: '#e0f877',
    300: '#d3f655',
    400: '#c3f53c',
    500: '#a8dc1f',
    600: '#86b312',
    700: '#658710',
    800: '#4a6212',
    900: '#3a4d13',
  },

  blue: {
    25: '#f5faff',
    50: '#eff8ff',
    100: '#d1e9ff',
    200: '#b2ddff',
    300: '#84caff',
    400: '#53b1fd',
    500: '#2e90fa',
    600: '#1570ef',
    700: '#175cd3',
    800: '#1849a9',
    900: '#194185',
  },

  green: {
    25: '#f6fef9',
    50: '#ecfdf3',
    100: '#d1fadf',
    200: '#a6f4c5',
    300: '#6ce9a6',
    400: '#32d583',
    500: '#12b76a',
    600: '#039855',
    700: '#027a48',
    800: '#05603a',
    900: '#054f31',
  },

  amber: {
    25: '#fffcf5',
    50: '#fffaeb',
    100: '#fef0c7',
    200: '#fedf89',
    300: '#fec84b',
    400: '#fdb022',
    500: '#f79009',
    600: '#dc6803',
    700: '#b54708',
    800: '#93370d',
    900: '#7a2e0e',
  },

  red: {
    25: '#fffbfa',
    50: '#fef3f2',
    100: '#fee4e2',
    200: '#fecdca',
    300: '#fda29b',
    400: '#f97066',
    500: '#f04438',
    600: '#d92d20',
    700: '#b42318',
    800: '#912018',
    900: '#7a271a',
  },

  violet: {
    25: '#fbfaff',
    50: '#f4f3ff',
    100: '#ebe9fe',
    200: '#d9d6fe',
    300: '#bdb4fe',
    400: '#9b8afb',
    500: '#7a5af8',
    600: '#6938ef',
    700: '#5925dc',
    800: '#4a1fb8',
    900: '#3e1c96',
  },
} as const

/** 4px 배수 스페이싱 스케일 */
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const

/**
 * 곡률.
 *
 * ERP 화면은 표와 선으로 짜인 격자다. 곡률이 커지면 모서리마다 여백이 생겨 격자가
 * 흐트러지고, 카드가 여러 장 겹칠수록 화면이 물렁해 보인다. 값을 전체적으로 내렸다 —
 * 각 요소가 자기 자리에 딱 떨어지는 편이 훑기에 낫다.
 */
export const radius = {
  none: '0px',
  xs: '2px',
  sm: '4px',
  /** 컨트롤 — 버튼 · 인풋 · 셀렉트 */
  md: '6px',
  /** 떠 있는 면 — 모달 · 드로어 · 토스트 */
  lg: '8px',
  xl: '10px',
  '2xl': '12px',
  full: '9999px',
} as const

export const borderWidth = {
  none: '0px',
  thin: '1px',
  thick: '2px',
} as const

/**
 * 컨트롤(버튼/인풋/셀렉트) 공통 높이 — 폼 정렬의 기준.
 *
 * 본문 12px 에 맞춰 낮췄다. 필터 줄이 표 위에 얹히는 화면이라 컨트롤이 높으면 정작
 * 봐야 할 행이 화면 밖으로 밀린다.
 */
export const controlHeight = {
  sm: '26px',
  md: '30px',
  lg: '36px',
} as const

/**
 * 표 셀의 여백.
 *
 * spacing 스케일(4px 배수)로는 이 값을 낼 수 없다. 8px 은 헐겁고 4px 은 글자가
 * 구분선에 붙는다 — 표는 한 화면에 몇 줄이 들어가느냐가 곧 사용성이라 6px 이 필요했다.
 * 스케일을 깨지 않도록 표 전용 토큰으로 따로 둔다.
 */
export const tableCell = {
  paddingY: '6px',
  paddingX: '10px',
  /** 머리 줄은 한 번만 읽히므로 더 조인다 */
  headPaddingY: '5px',
} as const

export const zIndex = {
  base: 0,
  sticky: 100,
  header: 200,
  drawer: 300,
  dropdown: 400,
  modal: 500,
  popover: 600,
  toast: 700,
  tooltip: 800,
} as const

export const breakpoint = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export const media = {
  sm: `@media (min-width: ${breakpoint.sm}px)`,
  md: `@media (min-width: ${breakpoint.md}px)`,
  lg: `@media (min-width: ${breakpoint.lg}px)`,
  xl: `@media (min-width: ${breakpoint.xl}px)`,
  '2xl': `@media (min-width: ${breakpoint['2xl']}px)`,
  maxSm: `@media (max-width: ${breakpoint.sm - 1}px)`,
  maxMd: `@media (max-width: ${breakpoint.md - 1}px)`,
  maxLg: `@media (max-width: ${breakpoint.lg - 1}px)`,
} as const

/** 앱 셸 치수 — 레이아웃이 하드코딩하지 않도록 토큰화 */
export const layout = {
  gnbHeight: '56px',
  contentMaxWidth: '1440px',
  drawerWidth: '840px',
} as const

export const duration = {
  instant: '80ms',
  fast: '140ms',
  normal: '220ms',
  slow: '320ms',
} as const

export const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  entrance: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  /** 살짝 튕기는 마무리 — 카드가 떠오를 때만 */
  emphasized: 'cubic-bezier(0.2, 0, 0, 1.2)',
} as const

/**
 * 애니메이션 규칙.
 *
 * **transform 과 opacity 만 움직인다.** width · height · top · box-shadow 를 전이하면
 * 프레임마다 레이아웃과 페인트가 다시 돌아 26줄짜리 표에서 스크롤이 끊긴다. 두 속성은
 * 합성 단계에서만 처리되어 메인 스레드를 잡지 않는다.
 *
 * 그림자를 움직이고 싶을 때는 그림자를 가진 가상 요소의 opacity 를 바꾼다 —
 * lift 헬퍼가 그렇게 한다.
 */
export const motion = {
  /** 호버·포커스처럼 손끝에 붙어야 하는 반응 */
  hover: `${duration.fast} ${easing.standard}`,
  /** 열리고 닫히는 면 */
  surface: `${duration.normal} ${easing.entrance}`,
  /** 값이 바뀐 자리를 한 번 짚어줄 때 */
  emphasis: `${duration.normal} ${easing.emphasized}`,
} as const

/**
 * 움직임을 원하지 않는 사용자.
 *
 * 전역에서 한 번 끄지만(GlobalStyle), 키프레임을 직접 도는 컴포넌트는 자기 자리에서도
 * 확인해야 한다 — 전역 규칙은 duration 만 지우고 시작 상태(opacity: 0)는 남기기 때문이다.
 */
export const reducedMotion = '@media (prefers-reduced-motion: reduce)'

export const fontFamily = {
  sans: `'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo',
    'Malgun Gothic', 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif`,
  mono: `'JetBrains Mono', 'D2Coding', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`,
} as const

/**
 * 타이포 스케일. **md 가 기본 본문이고 12px 이다.**
 *
 * ERP 화면은 한 번에 읽는 행이 많아 글자가 커지면 스크롤이 늘고, 스크롤이 늘면 담당자가
 * 목록을 훑는 대신 검색에 의존하게 된다. 배송 준비 현황은 26줄을 한 화면에 담는 것이
 * 목표라 본문을 12px 로 내렸다.
 *
 * 대신 xs(10px)는 쓰지 않는다 — 한글은 10px 에서 받침이 뭉갠다. 보조 문구는 sm(11px)
 * 까지만 내려간다.
 */
export const fontSize = {
  xs: '0.625rem', // 10 — 라틴 대문자 라벨 전용. 한글에는 쓰지 않는다
  sm: '0.6875rem', // 11 — 보조 문구 · 표 머리
  md: '0.75rem', // 12 — 기본 본문
  lg: '0.875rem', // 14
  xl: '1rem', // 16
  '2xl': '1.25rem', // 20
  '3xl': '1.5rem', // 24
  '4xl': '1.875rem', // 30
} as const

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

export const lineHeight = {
  tight: 1.25,
  snug: 1.4,
  normal: 1.55,
  relaxed: 1.75,
} as const

export const letterSpacing = {
  tighter: '-0.02em',
  tight: '-0.01em',
  normal: '0',
  wide: '0.02em',
} as const

export type SpacingKey = keyof typeof spacing
