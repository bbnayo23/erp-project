import type { ReactNode } from 'react'
import { ThemeProvider } from './ThemeProvider'

export { useThemeMode } from './ThemeProvider'

/** 앱 전역 프로바이더를 한 곳에 모은다 — 추가될 때 App.tsx 를 건드리지 않게 한다 */
export function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
