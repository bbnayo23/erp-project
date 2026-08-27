import styled, { css, type DefaultTheme } from 'styled-components'
import type { BadgeSize, BadgeTone, BadgeVariant } from './types'

interface ToneColors {
  solid: string
  subtle: string
  text: string
  border: string
  /** solid 배경 위에 올릴 글자색 */
  onSolid: string
}

/**
 * solid 배경 위의 글자색은 톤마다 다르다.
 *
 * 대부분의 톤은 테마가 밝으면 어둡고 테마가 어두우면 밝아서 `textInverse` 하나로 맞는다.
 * 예외는 warning 이다 — 앰버는 라이트 테마에서도 이미 밝아서 흰 글자를 올리면 읽히지
 * 않는다. 그래서 두 테마 모두 어두운 글자(onPoint)를 쓴다. 포인트 색(라임)도 같은 이유다.
 */
const onSolidFor = (theme: DefaultTheme, tone: BadgeTone): string =>
  tone === 'warning' || tone === 'point' ? theme.colors.onPoint : theme.colors.textInverse

const toneColors = (theme: DefaultTheme, tone: BadgeTone): ToneColors => {
  const { colors } = theme
  const map: Record<BadgeTone, Omit<ToneColors, 'onSolid'>> = {
    neutral: {
      solid: colors.textMuted,
      subtle: colors.surfaceMuted,
      text: colors.textMuted,
      border: colors.borderStrong,
    },
    primary: {
      solid: colors.primary,
      subtle: colors.primarySubtle,
      text: colors.primary,
      border: colors.primaryBorder,
    },
    point: {
      solid: colors.point,
      subtle: colors.pointSubtle,
      // 라임은 글자색으로 쓸 대비가 없다. 텍스트가 필요한 자리에는 어두운 색을 쓴다.
      text: colors.onPoint,
      border: colors.pointBorder,
    },
    success: {
      solid: colors.success,
      subtle: colors.successSubtle,
      text: colors.successText,
      border: colors.success,
    },
    warning: {
      solid: colors.warning,
      subtle: colors.warningSubtle,
      text: colors.warningText,
      border: colors.warning,
    },
    danger: {
      solid: colors.danger,
      subtle: colors.dangerSubtle,
      text: colors.dangerText,
      border: colors.danger,
    },
    info: {
      solid: colors.info,
      subtle: colors.infoSubtle,
      text: colors.infoText,
      border: colors.info,
    },
  }
  return { ...map[tone], onSolid: onSolidFor(theme, tone) }
}

export const BadgeRoot = styled.span<{
  $tone: BadgeTone
  $variant: BadgeVariant
  $size: BadgeSize
  $dot: boolean
}>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  border-radius: ${({ theme }) => theme.radius.full};
  border: ${({ theme }) => theme.borderWidth.thin} solid transparent;
  white-space: nowrap;
  line-height: 1;

  /*
   * 상태값은 이 앱에서 가장 자주 읽히는 정보다. 12px 로 두면 표를 훑을 때 눈에 걸리지
   * 않아 결국 옆의 설명 문구를 읽게 된다 — 배지가 제 일을 못 하는 것이다.
   */
  ${({ theme, $size }) =>
    $size === 'sm'
      ? css`
          height: 22px;
          padding-inline: ${theme.spacing[2]};
          font-size: ${theme.font.size.sm};
        `
      : css`
          height: 26px;
          padding-inline: ${theme.spacing[3]};
          font-size: ${theme.font.size.md};
        `}

  ${({ theme, $tone, $variant }) => {
    const c = toneColors(theme, $tone)

    switch ($variant) {
      case 'solid':
        return css`
          background: ${c.solid};
          color: ${c.onSolid};
          font-weight: ${theme.font.weight.semibold};
        `
      case 'outline':
        return css`
          background: transparent;
          color: ${c.text};
          border-color: ${c.border};
          font-weight: ${theme.font.weight.medium};
        `
      case 'strong':
        return css`
          background: ${c.subtle};
          color: ${c.text};
          border-color: ${c.border};
          font-weight: ${theme.font.weight.semibold};
        `
      case 'subtle':
        return css`
          background: ${c.subtle};
          color: ${c.text};
          font-weight: ${theme.font.weight.medium};
        `
    }
  }}

  ${({ theme, $tone, $variant, $dot }) =>
    $dot &&
    css`
      &::before {
        content: '';
        flex-shrink: 0;
        width: 7px;
        height: 7px;
        border-radius: ${theme.radius.full};
        background: ${
          $variant === 'solid' ? toneColors(theme, $tone).onSolid : toneColors(theme, $tone).solid
        };
      }
    `}
`
