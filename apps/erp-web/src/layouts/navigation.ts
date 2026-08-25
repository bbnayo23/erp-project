export interface NavItem {
  label: string
  to: string
  /** 인라인 SVG path (24x24 viewBox) */
  icon: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const NAVIGATION: NavGroup[] = [
  {
    title: '개요',
    items: [
      {
        label: '대시보드',
        to: '/',
        icon: 'M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z',
      },
    ],
  },
  {
    title: '기준정보',
    items: [
      {
        label: '사원관리',
        to: '/employees',
        icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z',
      },
      {
        label: '품목관리',
        to: '/products',
        icon: 'M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3L18.5 8 12 11.7 5.5 8 12 4.3ZM5 9.7l6 3.4v6.6l-6-3.3V9.7Zm8 10v-6.6l6-3.4v6.7l-6 3.3Z',
      },
    ],
  },
  {
    title: '영업',
    items: [
      {
        label: '수주관리',
        to: '/orders',
        icon: 'M7 4h10a2 2 0 0 1 2 2v14l-3-2-2 2-2-2-2 2-2-2-3 2V6a2 2 0 0 1 2-2Zm1 5h8V7H8v2Zm0 4h8v-2H8v2Zm0 4h5v-2H8v2Z',
      },
    ],
  },
  {
    title: '설정',
    items: [
      {
        label: '환경설정',
        to: '/settings',
        icon: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 4a8.9 8.9 0 0 1-.1 1.3l2 1.6-2 3.4-2.4-1a9 9 0 0 1-2.2 1.3l-.4 2.5H10l-.4-2.5a9 9 0 0 1-2.2-1.3l-2.4 1-2-3.4 2-1.6a9.4 9.4 0 0 1 0-2.6l-2-1.6 2-3.4 2.4 1A9 9 0 0 1 9.6 5.2L10 2.7h4l.4 2.5c.8.3 1.5.7 2.2 1.3l2.4-1 2 3.4-2 1.6c.1.5.1.9.1 1.5Z',
      },
    ],
  },
]
