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
  arrowRight: 'M5 12h13m0 0-5-5m5 5-5 5',
  check: 'M5 13l4 4L19 7',
  alert: 'M12 2 1 21h22L12 2Zm0 5.6 7.5 12.9h-15L12 7.6ZM11 10v5h2v-5h-2Zm0 6v2h2v-2h-2Z',
  clock:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-1 3v6l5 3 1-1.7-4-2.3V7h-2Z',
  chevronDown: 'M6 9.5l6 6 6-6',
  reset: 'M20 12a8 8 0 1 1-2.4-5.7M20 4v4h-4',
  plus: 'M12 5v14M5 12h14',
  inbound: 'M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 19h16',
  outbound: 'M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M4 19h16',
  lock: 'M6 11h12v9H6v-9Zm2.5 0V7.5a3.5 3.5 0 1 1 7 0V11',
  unlock: 'M6 11h12v9H6v-9Zm2.5 0V7.5a3.5 3.5 0 0 1 6.9-.9',
  back: 'M19 12H5m0 0 6-6m-6 6 6 6',
}

/**
 * 선으로 그리는 아이콘.
 *
 * 버튼 안에 들어가는 아이콘은 전부 선이다 — 글자 옆에 면으로 채운 도형이 서면 그쪽이
 * 먼저 읽혀 라벨이 뒤로 밀린다. 면으로 그리는 것은 메뉴 아이콘처럼 혼자 서는 것뿐이다.
 */
const STROKED = new Set<IconName>([
  'close',
  'arrowRight',
  'check',
  'chevronDown',
  'reset',
  'plus',
  'inbound',
  'outbound',
  'lock',
  'unlock',
  'back',
])

export const Icon = ({ name, size = 18, className }: IconProps) => {
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
        strokeLinejoin={stroked ? 'round' : undefined}
      />
    </svg>
  )
}
