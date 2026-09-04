import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { GlobalStyle } from '@/styles/GlobalStyle'
import { themes, type ThemeMode } from '@/styles/theme'

interface ThemeControl {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const ThemeControlContext = createContext<ThemeControl | null>(null)

const STORAGE_KEY = 'erp:theme-mode'

/** 새로고침에도 모드가 유지되게 한다. 스토리지 접근이 막힌 환경에서도 죽지 않아야 한다. */
const readStoredMode = (): ThemeMode => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'dark' || stored === 'light' ? stored : 'light'
  } catch {
    return 'light'
  }
}

const writeStoredMode = (mode: ThemeMode) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // 저장 실패는 무시한다 — 테마는 화면에만 영향을 준다
  }
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode)

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    writeStoredMode(next)
  }, [])

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      writeStoredMode(next)
      return next
    })
  }, [])

  const control = useMemo<ThemeControl>(
    () => ({ mode, setMode, toggleMode }),
    [mode, setMode, toggleMode],
  )

  return (
    <ThemeControlContext.Provider value={control}>
      <StyledThemeProvider theme={themes[mode]}>
        <GlobalStyle />
        {children}
      </StyledThemeProvider>
    </ThemeControlContext.Provider>
  )
}

export const useThemeMode = (): ThemeControl => {
  const ctx = useContext(ThemeControlContext)
  if (!ctx) throw new Error('useThemeMode 는 ThemeProvider 내부에서만 사용할 수 있습니다.')
  return ctx
}
