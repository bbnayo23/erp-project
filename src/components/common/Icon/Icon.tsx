import type { IconName, IconProps } from './types'

/**
 * 24x24 viewBox 기준 단색 아이콘.
 * 색은 currentColor 를 따르므로 버튼·링크 안에 넣으면 글자색과 자동으로 맞는다.
 */
const PATHS: Record<IconName, string> = {
  close: 'M6 6l12 12M18 6L6 18',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-13a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1Zm0 14a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM4 12a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm14 0a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1ZM6.3 6.3a1 1 0 0 1 1.4 0l.7.7a1 1 0 0 1-1.4 1.4l-.7-.7a1 1 0 0 1 0-1.4Zm9.3 9.3a1 1 0 0 1 1.4 0l.7.7a1 1 0 0 1-1.4 1.4l-.7-.7a1 1 0 0 1 0-1.4Zm2.1-9.3a1 1 0 0 1 0 1.4l-.7.7a1 1 0 0 1-1.4-1.4l.7-.7a1 1 0 0 1 1.4 0ZM8.4 15.6a1 1 0 0 1 0 1.4l-.7.7a1 1 0 0 1-1.4-1.4l.7-.7a1 1 0 0 1 1.4 0Z',
  moon: 'M21 13.2A9 9 0 1 1 10.8 3a7 7 0 0 0 10.2 10.2Z',
  inventory:
    'M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3L18.5 8 12 11.7 5.5 8 12 4.3ZM5 9.7l6 3.4v6.6l-6-3.3V9.7Zm8 10v-6.6l6-3.4v6.7l-6 3.3Z',
  orders:
    'M7 4h10a2 2 0 0 1 2 2v14l-3-2-2 2-2-2-2 2-2-2-3 2V6a2 2 0 0 1 2-2Zm1 5h8V7H8v2Zm0 4h8v-2H8v2Zm0 4h5v-2H8v2Z',
  purchase:
    'M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM2 3h3l1 2h15l-3 8H7l-.4 1.2c-.1.4.2.8.6.8H19v2H7.2A2.2 2.2 0 0 1 5 14.6L6.3 11 4 5H2V3Z',
}

/** close 는 선으로, 나머지는 면으로 그린다 */
const STROKED = new Set<IconName>(['close'])

export function Icon({ name, size = 18, className }: IconProps) {
  const stroked = STROKED.has(name)

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={stroked ? 'none' : 'currentColor'}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={PATHS[name]}
        stroke={stroked ? 'currentColor' : undefined}
        strokeWidth={stroked ? 1.8 : undefined}
        strokeLinecap={stroked ? 'round' : undefined}
      />
    </svg>
  )
}
