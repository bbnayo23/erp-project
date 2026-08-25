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

export type SpacingKey = keyof typeof spacing

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
  sidebarWidth: '248px',
  sidebarCollapsedWidth: '64px',
  headerHeight: '56px',
  contentMaxWidth: '1440px',
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
