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
  textStyle,
  zIndex,
} from '../tokens'

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
  background: palette.gray[50],
  surface: palette.white,
  surfaceMuted: palette.gray[50],
  surfaceHover: palette.gray[100],
  surfaceSelected: palette.blue[50],
  surfaceDisabled: palette.gray[100],
  overlay: 'rgba(16, 24, 40, 0.55)',

  border: palette.gray[200],
  borderStrong: palette.gray[300],
  borderFocus: palette.blue[500],

  text: palette.gray[900],
  textMuted: palette.gray[600],
  textSubtle: palette.gray[500],
  textDisabled: palette.gray[400],
  textInverse: palette.white,
  textLink: palette.blue[600],

  primary: palette.blue[600],
  primaryHover: palette.blue[700],
  primaryActive: palette.blue[800],
  primarySubtle: palette.blue[50],
  primaryBorder: palette.blue[200],
  onPrimary: palette.white,

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
  background: palette.gray[950],
  surface: palette.gray[900],
  surfaceMuted: palette.gray[800],
  surfaceHover: palette.gray[800],
  surfaceSelected: 'rgba(21, 112, 239, 0.16)',
  surfaceDisabled: palette.gray[800],
  overlay: 'rgba(0, 0, 0, 0.65)',

  border: palette.gray[800],
  borderStrong: palette.gray[700],
  borderFocus: palette.blue[400],

  text: palette.gray[50],
  textMuted: palette.gray[300],
  textSubtle: palette.gray[400],
  textDisabled: palette.gray[600],
  textInverse: palette.gray[900],
  textLink: palette.blue[300],

  primary: palette.blue[500],
  primaryHover: palette.blue[400],
  primaryActive: palette.blue[300],
  primarySubtle: 'rgba(46, 144, 250, 0.14)',
  primaryBorder: palette.blue[800],
  onPrimary: palette.white,

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
  xs: '0 1px 2px rgba(16, 24, 40, 0.05)',
  sm: '0 1px 3px rgba(16, 24, 40, 0.10), 0 1px 2px rgba(16, 24, 40, 0.06)',
  md: '0 4px 8px -2px rgba(16, 24, 40, 0.10), 0 2px 4px -2px rgba(16, 24, 40, 0.06)',
  lg: '0 12px 16px -4px rgba(16, 24, 40, 0.08), 0 4px 6px -2px rgba(16, 24, 40, 0.03)',
  focus: '0 0 0 3px rgba(46, 144, 250, 0.28)',
  focusDanger: '0 0 0 3px rgba(240, 68, 56, 0.28)',
}

const darkShadow: ShadowScale = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.40)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.50)',
  md: '0 4px 8px -2px rgba(0, 0, 0, 0.55)',
  lg: '0 12px 16px -4px rgba(0, 0, 0, 0.60)',
  focus: '0 0 0 3px rgba(83, 177, 253, 0.35)',
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
  textStyle,
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
