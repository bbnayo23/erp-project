import styled, { css, type DefaultTheme } from 'styled-components'
import type { BadgeSize, BadgeTone, BadgeVariant } from './types'

interface ToneColors {
  solid: string
  subtle: string
  text: string
  border: string
}

const toneColors = (theme: DefaultTheme, tone: BadgeTone): ToneColors => {
  const { colors } = theme
  const map: Record<BadgeTone, ToneColors> = {
    neutral: {
      solid: colors.textMuted,
      subtle: colors.surfaceMuted,
      text: colors.textMuted,
      border: colors.border,
    },
    primary: {
      solid: colors.primary,
      subtle: colors.primarySubtle,
      text: colors.primary,
      border: colors.primaryBorder,
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
  return map[tone]
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
  font-weight: ${({ theme }) => theme.font.weight.medium};
  white-space: nowrap;
  line-height: 1;

  ${({ theme, $size }) =>
    $size === 'sm'
      ? css`
          height: 20px;
          padding-inline: ${theme.spacing[2]};
          font-size: ${theme.font.size.xs};
        `
      : css`
          height: 24px;
          padding-inline: ${theme.spacing[3]};
          font-size: ${theme.font.size.sm};
        `}

  ${({ theme, $tone, $variant }) => {
    const c = toneColors(theme, $tone)
    if ($variant === 'solid') {
      return css`
        background: ${c.solid};
        color: ${theme.colors.onPrimary};
      `
    }
    if ($variant === 'outline') {
      return css`
        background: transparent;
        color: ${c.text};
        border-color: ${c.border};
      `
    }
    return css`
      background: ${c.subtle};
      color: ${c.text};
    `
  }}

  ${({ theme, $tone, $variant, $dot }) =>
    $dot &&
    css`
      &::before {
        content: '';
        flex-shrink: 0;
        width: 6px;
        height: 6px;
        border-radius: ${theme.radius.full};
        background: ${
          $variant === 'solid' ? theme.colors.onPrimary : toneColors(theme, $tone).solid
        };
      }
    `}
`
