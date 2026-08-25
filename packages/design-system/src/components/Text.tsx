import styled, { css } from 'styled-components'
import type { SemanticColors } from '../theme/theme'
import type { TextStyleName } from '../tokens'

type TextColor = Extract<
  keyof SemanticColors,
  | 'text'
  | 'textMuted'
  | 'textSubtle'
  | 'textDisabled'
  | 'textInverse'
  | 'textLink'
  | 'primary'
  | 'successText'
  | 'warningText'
  | 'dangerText'
  | 'infoText'
>

export interface TextProps {
  variant?: TextStyleName
  color?: TextColor
  align?: 'left' | 'center' | 'right'
  /** 지정한 줄 수에서 말줄임 처리 */
  clamp?: number
  truncate?: boolean
  /** 숫자 정렬용 tabular-nums — 금액/수량 컬럼에 사용 */
  numeric?: boolean
}

export const Text = styled.span<TextProps>`
  ${({ theme, variant = 'body' }) => {
    const style = theme.textStyle[variant]
    return css`
      font-size: ${style.fontSize};
      font-weight: ${style.fontWeight};
      line-height: ${style.lineHeight};
      letter-spacing: ${style.letterSpacing};
      font-family: ${variant === 'code' ? theme.font.family.mono : 'inherit'};
    `
  }}
  color: ${({ theme, color = 'text' }) => theme.colors[color]};
  text-align: ${({ align = 'left' }) => align};

  ${({ numeric }) =>
    numeric &&
    css`
      font-variant-numeric: tabular-nums;
      font-feature-settings: 'tnum';
    `}

  ${({ truncate }) =>
    truncate &&
    css`
      display: block;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    `}

  ${({ clamp }) =>
    clamp &&
    css`
      display: -webkit-box;
      -webkit-line-clamp: ${clamp};
      -webkit-box-orient: vertical;
      overflow: hidden;
    `}
`

export const Heading = styled(Text).attrs<TextProps>(({ variant = 'h2' }) => ({
  as: variant === 'h1' ? 'h1' : variant === 'h3' ? 'h3' : 'h2',
  variant,
}))``
