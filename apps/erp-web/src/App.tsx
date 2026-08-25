import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider, ToastProvider } from '@erp/design-system'
import { router } from '@/app/router'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'

export function App() {
  const themeMode = useUiStore((state) => state.themeMode)
  const fetchMe = useAuthStore((state) => state.fetchMe)

  // 앱 진입 시 현재 사용자 조회 (목업에서는 항상 성공)
  useEffect(() => {
    void fetchMe()
  }, [fetchMe])

  return (
    <ThemeProvider mode={themeMode} withGlobalStyle>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ThemeProvider>
  )
}
