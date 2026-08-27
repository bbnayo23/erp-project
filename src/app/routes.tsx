import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { InventoryPage } from '@/pages/InventoryPage'
import { OrderDetailPage } from '@/pages/OrderDetailPage'
import { PreparationPage } from '@/pages/PreparationPage'
import { PurchasePage } from '@/pages/PurchasePage'

/**
 * 재고 · 수주 · 발주 세 메뉴가 모두 실제 화면을 가리킨다.
 * 수주는 배송 준비 현황으로 들어간다 — 이 프로젝트의 중심 화면이다.
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
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'orders', element: <PreparationPage /> },
      { path: 'orders/:orderId', element: <OrderDetailPage /> },
      { path: 'purchase', element: <PurchasePage /> },
      { path: '*', element: <Navigate to="/orders" replace /> },
    ],
  },
])
