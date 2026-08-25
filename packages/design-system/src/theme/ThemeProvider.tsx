import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { GlobalStyle } from './GlobalStyle'
import { themes, type ThemeMode } from './theme'

interface ThemeControl {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const ThemeControlContext = createContext<ThemeControl | null>(null)

export interface ThemeProviderProps {
  children: ReactNode
  /** 초기 모드 (uncontrolled). 기본값 'light' */
  defaultMode?: ThemeMode
  /** 외부에서 모드를 제어할 때 사용 (controlled) */
  mode?: ThemeMode
  /** GlobalStyle 주입 여부. 앱 루트에서 한 번만 true 로 둔다. */
  withGlobalStyle?: boolean
}

export function ThemeProvider({
  children,
  defaultMode = 'light',
  mode,
  withGlobalStyle = true,
}: ThemeProviderProps) {
  const [internalMode, setInternalMode] = useState<ThemeMode>(defaultMode)
  const activeMode = mode ?? internalMode

  const setMode = useCallback((next: ThemeMode) => setInternalMode(next), [])
  const toggleMode = useCallback(
    () => setInternalMode((prev) => (prev === 'light' ? 'dark' : 'light')),
    [],
  )

  const control = useMemo<ThemeControl>(
    () => ({ mode: activeMode, setMode, toggleMode }),
    [activeMode, setMode, toggleMode],
  )

  return (
    <ThemeControlContext.Provider value={control}>
      <StyledThemeProvider theme={themes[activeMode]}>
        {withGlobalStyle && <GlobalStyle />}
        {children}
      </StyledThemeProvider>
    </ThemeControlContext.Provider>
  )
}

export function useThemeMode(): ThemeControl {
  const ctx = useContext(ThemeControlContext)
  if (!ctx) throw new Error('useThemeMode 는 ThemeProvider 내부에서만 사용할 수 있습니다.')
  return ctx
}
