import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { OrderDetailPage } from '@/pages/OrderDetailPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { PreparationPage } from '@/pages/PreparationPage'

/**
 * 수주는 배송 준비 현황으로 들어간다 — 이 프로젝트의 중심 화면이다.
 * 재고·발주 화면은 아직 임시 페이지를 가리킨다.
 *
 * 첫 화면도 준비 현황으로 보낸다. 담당자가 아침에 여는 화면이 '오늘 무엇을 내보낼 수
 * 있는가' 이기 때문이다.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/orders" replace /> },
      { path: 'inventory', element: <PlaceholderPage /> },
      { path: 'orders', element: <PreparationPage /> },
      { path: 'orders/:orderId', element: <OrderDetailPage /> },
      { path: 'purchase', element: <PlaceholderPage /> },
      { path: '*', element: <Navigate to="/orders" replace /> },
    ],
  },
])
