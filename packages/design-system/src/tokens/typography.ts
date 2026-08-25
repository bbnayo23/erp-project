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

/** 자주 쓰는 조합 프리셋 (Text 컴포넌트의 `variant`) */
export const textStyle = {
  display: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },
  h1: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  subtitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodyStrong: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  code: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
} as const

export type TextStyleName = keyof typeof textStyle
