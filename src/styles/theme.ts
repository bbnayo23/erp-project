import {
  borderWidth,
  controlHeight,
  duration,
  easing,
  fontFamily,
  fontSize,
  fontWeight,
  layout,
  letterSpacing,
  lineHeight,
  media,
  palette,
  radius,
  spacing,
  zIndex,
} from './tokens'

/**
 * Semantic color contract.
 * light/dark 두 테마가 이 shape 을 동일하게 채운다 → 컴포넌트는 모드를 몰라도 된다.
 */
export interface SemanticColors {
  /** 페이지 배경 */
  background: string
  /** 카드/패널 등 올라온 표면 */
  surface: string
  surfaceMuted: string
  surfaceHover: string
  surfaceSelected: string
  surfaceDisabled: string
  /** 오버레이(모달 딤) */
  overlay: string

  border: string
  borderStrong: string
  borderFocus: string

  text: string
  textMuted: string
  textSubtle: string
  textDisabled: string
  textInverse: string
  textLink: string

  primary: string
  primaryHover: string
  primaryActive: string
  primarySubtle: string
  primaryBorder: string
  onPrimary: string

  /**
   * 포인트 색 — '지금 이걸 하라' 한 곳에만 쓴다.
   * 라임은 흰 배경에서 글자로 쓸 대비가 없으므로 배경으로만 쓰고 onPoint 를 글자색으로 올린다.
   * 상태색(success/warning/danger)과 색상이 겹치지 않아 '급함' 과 '심각함' 이 구분된다.
   */
  point: string
  pointHover: string
  pointSubtle: string
  pointBorder: string
  onPoint: string

  success: string
  successSubtle: string
  successText: string

  warning: string
  warningSubtle: string
  warningText: string

  danger: string
  dangerHover: string
  dangerSubtle: string
  dangerText: string

  info: string
  infoSubtle: string
  infoText: string
}

export interface ShadowScale {
  none: string
  xs: string
  sm: string
  md: string
  lg: string
  focus: string
  focusDanger: string
}

const lightColors: SemanticColors = {
  background: palette.slate[50],
  surface: palette.white,
  surfaceMuted: palette.slate[50],
  surfaceHover: palette.slate[100],
  surfaceSelected: palette.navy[50],
  surfaceDisabled: palette.slate[100],
  overlay: 'rgba(12, 17, 32, 0.55)',

  border: palette.slate[200],
  borderStrong: palette.slate[300],
  borderFocus: palette.navy[500],

  text: palette.slate[900],
  textMuted: palette.slate[600],
  textSubtle: palette.slate[500],
  textDisabled: palette.slate[400],
  textInverse: palette.white,
  textLink: palette.navy[600],

  primary: palette.navy[600],
  primaryHover: palette.navy[700],
  primaryActive: palette.navy[800],
  primarySubtle: palette.navy[50],
  primaryBorder: palette.navy[200],
  onPrimary: palette.white,

  point: palette.lime[400],
  pointHover: palette.lime[300],
  pointSubtle: palette.lime[50],
  pointBorder: palette.lime[500],
  onPoint: palette.navy[800],

  success: palette.green[600],
  successSubtle: palette.green[50],
  successText: palette.green[700],

  warning: palette.amber[500],
  warningSubtle: palette.amber[50],
  warningText: palette.amber[700],

  danger: palette.red[600],
  dangerHover: palette.red[700],
  dangerSubtle: palette.red[50],
  dangerText: palette.red[700],

  info: palette.violet[600],
  infoSubtle: palette.violet[50],
  infoText: palette.violet[700],
}

const darkColors: SemanticColors = {
  background: palette.slate[950],
  surface: palette.slate[900],
  surfaceMuted: palette.slate[800],
  surfaceHover: palette.slate[800],
  surfaceSelected: 'rgba(127, 151, 216, 0.16)',
  surfaceDisabled: palette.slate[800],
  overlay: 'rgba(0, 0, 0, 0.68)',

  border: palette.slate[800],
  borderStrong: palette.slate[700],
  borderFocus: palette.navy[300],

  text: palette.slate[50],
  textMuted: palette.slate[300],
  textSubtle: palette.slate[400],
  textDisabled: palette.slate[600],
  textInverse: palette.slate[900],
  textLink: palette.navy[300],

  // 다크 배경에서는 navy[600] 이 배경과 붙어 버려 한 단계 밝은 쪽을 primary 로 쓴다
  primary: palette.navy[300],
  primaryHover: palette.navy[200],
  primaryActive: palette.navy[100],
  primarySubtle: 'rgba(127, 151, 216, 0.16)',
  primaryBorder: palette.navy[500],
  onPrimary: palette.navy[900],

  point: palette.lime[400],
  pointHover: palette.lime[300],
  pointSubtle: 'rgba(195, 245, 60, 0.14)',
  pointBorder: palette.lime[600],
  onPoint: palette.navy[900],

  success: palette.green[400],
  successSubtle: 'rgba(18, 183, 106, 0.14)',
  successText: palette.green[300],

  warning: palette.amber[400],
  warningSubtle: 'rgba(247, 144, 9, 0.14)',
  warningText: palette.amber[300],

  danger: palette.red[400],
  dangerHover: palette.red[300],
  dangerSubtle: 'rgba(240, 68, 56, 0.14)',
  dangerText: palette.red[300],

  info: palette.violet[400],
  infoSubtle: 'rgba(122, 90, 248, 0.16)',
  infoText: palette.violet[300],
}

const lightShadow: ShadowScale = {
  none: 'none',
  xs: '0 1px 2px rgba(20, 28, 48, 0.05)',
  sm: '0 1px 3px rgba(20, 28, 48, 0.10), 0 1px 2px rgba(20, 28, 48, 0.06)',
  md: '0 4px 8px -2px rgba(20, 28, 48, 0.10), 0 2px 4px -2px rgba(20, 28, 48, 0.06)',
  lg: '0 12px 16px -4px rgba(20, 28, 48, 0.10), 0 4px 6px -2px rgba(20, 28, 48, 0.04)',
  focus: '0 0 0 3px rgba(42, 70, 147, 0.24)',
  focusDanger: '0 0 0 3px rgba(240, 68, 56, 0.28)',
}

const darkShadow: ShadowScale = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.40)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.50)',
  md: '0 4px 8px -2px rgba(0, 0, 0, 0.55)',
  lg: '0 12px 16px -4px rgba(0, 0, 0, 0.60)',
  focus: '0 0 0 3px rgba(127, 151, 216, 0.35)',
  focusDanger: '0 0 0 3px rgba(249, 112, 102, 0.35)',
}

const shared = {
  spacing,
  radius,
  borderWidth,
  controlHeight,
  zIndex,
  media,
  layout,
  duration,
  easing,
  font: {
    family: fontFamily,
    size: fontSize,
    weight: fontWeight,
    lineHeight,
    letterSpacing,
  },
  palette,
} as const

export const lightTheme = {
  mode: 'light' as const,
  colors: lightColors,
  shadow: lightShadow,
  ...shared,
}

export const darkTheme = {
  mode: 'dark' as const,
  colors: darkColors,
  shadow: darkShadow,
  ...shared,
}

export type ThemeMode = 'light' | 'dark'

/**
 * 전체 테마 형태.
 * mode 는 리터럴로 좁히지 않는다 — typeof lightTheme 을 그대로 쓰면
 * mode 가 'light' 로 굳어 darkTheme 을 담을 수 없다.
 */
export type AppTheme = Omit<typeof lightTheme, 'mode'> & { mode: ThemeMode }

export const themes: Record<ThemeMode, AppTheme> = {
  light: lightTheme,
  dark: darkTheme,
}
