import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

/**
 * 화면 구현 전이라 모든 경로가 임시 페이지를 가리킨다.
 * GNB 의 재고·수주·발주 메뉴가 붙을 자리는 그대로 남겨둔다.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <PlaceholderPage /> },
      { path: 'inventory', element: <PlaceholderPage /> },
      { path: 'orders', element: <PlaceholderPage /> },
      { path: 'purchase', element: <PlaceholderPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
