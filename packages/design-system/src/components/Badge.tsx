import styled, { css, type DefaultTheme } from 'styled-components'

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
export type BadgeVariant = 'subtle' | 'solid' | 'outline'

export interface BadgeProps {
  tone?: BadgeTone
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  /** 좌측에 상태 점 표시 */
  dot?: boolean
}

const toneColors = (theme: DefaultTheme, tone: BadgeTone) => {
  const { colors } = theme
  const map: Record<BadgeTone, { solid: string; subtle: string; text: string; border: string }> = {
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

export const Badge = styled.span<BadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  border-radius: ${({ theme }) => theme.radius.full};
  border: ${({ theme }) => theme.borderWidth.thin} solid transparent;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  white-space: nowrap;
  line-height: 1;

  ${({ theme, size = 'md' }) =>
    size === 'sm'
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

  ${({ theme, tone = 'neutral', variant = 'subtle' }) => {
    const c = toneColors(theme, tone)
    if (variant === 'solid') {
      return css`
        background: ${c.solid};
        color: ${theme.colors.onPrimary};
      `
    }
    if (variant === 'outline') {
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

  &::before {
    ${({ dot, theme, tone = 'neutral', variant = 'subtle' }) =>
      dot &&
      css`
        content: '';
        width: 6px;
        height: 6px;
        border-radius: ${theme.radius.full};
        background: ${variant === 'solid' ? theme.colors.onPrimary : toneColors(theme, tone).solid};
      `}
  }
`
