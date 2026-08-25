import { useId, useState, type ReactNode } from 'react'
import styled, { css } from 'styled-components'

export interface TabItem {
  value: string
  label: ReactNode
  disabled?: boolean
  /** 라벨 우측 카운트 뱃지 */
  count?: number
}

export interface TabsProps {
  items: TabItem[]
  /** controlled */
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  variant?: 'underline' | 'pill'
  children?: ReactNode
  className?: string
}

const List = styled.div<{ $variant: 'underline' | 'pill' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme, $variant }) => ($variant === 'pill' ? theme.spacing[1] : theme.spacing[1])};
  overflow-x: auto;

  ${({ $variant, theme }) =>
    $variant === 'underline'
      ? css`
          border-bottom: ${theme.borderWidth.thin} solid ${theme.colors.border};
        `
      : css`
          padding: ${theme.spacing[1]};
          background: ${theme.colors.surfaceMuted};
          border-radius: ${theme.radius.md};
          align-self: flex-start;
        `}
`

const Tab = styled.button<{ $active: boolean; $variant: 'underline' | 'pill' }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  white-space: nowrap;
  border: 0;
  background: transparent;
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme, $active }) =>
    $active ? theme.font.weight.semibold : theme.font.weight.medium};
  transition:
    color ${({ theme }) => theme.duration.fast},
    background-color ${({ theme }) => theme.duration.fast};

  &:disabled {
    color: ${({ theme }) => theme.colors.textDisabled};
    cursor: not-allowed;
  }

  ${({ $variant, $active, theme }) =>
    $variant === 'underline'
      ? css`
          height: 40px;
          padding-inline: ${theme.spacing[3]};
          color: ${$active ? theme.colors.primary : theme.colors.textMuted};

          &::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: -1px;
            height: 2px;
            background: ${$active ? theme.colors.primary : 'transparent'};
            border-radius: ${theme.radius.full};
          }

          &:hover:not(:disabled) {
            color: ${$active ? theme.colors.primary : theme.colors.text};
          }
        `
      : css`
          height: 32px;
          padding-inline: ${theme.spacing[3]};
          border-radius: ${theme.radius.sm};
          color: ${$active ? theme.colors.text : theme.colors.textMuted};
          background: ${$active ? theme.colors.surface : 'transparent'};
          box-shadow: ${$active ? theme.shadow.xs : 'none'};

          &:hover:not(:disabled) {
            color: ${theme.colors.text};
          }
        `}
`

const Count = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding-inline: ${({ theme }) => theme.spacing[1]};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-variant-numeric: tabular-nums;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primarySubtle : theme.colors.surfaceMuted};
  color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.textMuted)};
`

const Panel = styled.div`
  padding-top: ${({ theme }) => theme.spacing[4]};
`

export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  variant = 'underline',
  children,
  className,
}: TabsProps) {
  const baseId = useId()
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value ?? '')
  const active = value ?? internal

  const select = (next: string) => {
    if (value === undefined) setInternal(next)
    onChange?.(next)
  }

  return (
    <div className={className}>
      <List role="tablist" $variant={variant}>
        {items.map((item) => {
          const isActive = item.value === active
          return (
            <Tab
              key={item.value}
              id={`${baseId}-tab-${item.value}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${item.value}`}
              disabled={item.disabled}
              $active={isActive}
              $variant={variant}
              onClick={() => select(item.value)}
            >
              {item.label}
              {item.count !== undefined && <Count $active={isActive}>{item.count}</Count>}
            </Tab>
          )
        })}
      </List>

      {children && (
        <Panel role="tabpanel" id={`${baseId}-panel-${active}`}>
          {children}
        </Panel>
      )}
    </div>
  )
}
