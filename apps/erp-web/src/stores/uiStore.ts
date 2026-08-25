import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeMode } from '@erp/design-system'

interface UiState {
  themeMode: ThemeMode
  sidebarCollapsed: boolean
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
  toggleSidebar: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      themeMode: 'light',
      sidebarCollapsed: false,
      setThemeMode: (themeMode) => set({ themeMode }),
      toggleTheme: () =>
        set((state) => ({ themeMode: state.themeMode === 'light' ? 'dark' : 'light' })),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    { name: 'erp:ui' },
  ),
)
