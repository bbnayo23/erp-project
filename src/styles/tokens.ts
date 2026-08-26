/**
 * Primitive design tokens — raw values only.
 * 의미(semantic)는 theme 레이어에서 부여한다. 컴포넌트에서 palette 를 직접 쓰지 말 것.
 */

export const palette = {
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  gray: {
    25: '#fcfcfd',
    50: '#f9fafb',
    100: '#f2f4f7',
    200: '#e4e7ec',
    300: '#d0d5dd',
    400: '#98a2b3',
    500: '#667085',
    600: '#475467',
    700: '#344054',
    800: '#1d2939',
    900: '#101828',
    950: '#0c111d',
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

export const radius = {
  none: '0px',
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const

export const borderWidth = {
  none: '0px',
  thin: '1px',
  thick: '2px',
} as const

/** 컨트롤(버튼/인풋/셀렉트) 공통 높이 — 폼 정렬의 기준 */
export const controlHeight = {
  sm: '32px',
  md: '38px',
  lg: '44px',
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
  drawerWidth: '520px',
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
} as const

export const fontFamily = {
  sans: `'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo',
    'Malgun Gothic', 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif`,
  mono: `'JetBrains Mono', 'D2Coding', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`,
} as const

export const fontSize = {
  xs: '0.75rem', // 12
  sm: '0.8125rem', // 13
  md: '0.875rem', // 14 — ERP 기본 본문
  lg: '1rem', // 16
  xl: '1.125rem', // 18
  '2xl': '1.375rem', // 22
  '3xl': '1.75rem', // 28
  '4xl': '2.25rem', // 36
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
