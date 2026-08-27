import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { InventoryPage } from '@/pages/InventoryPage'
import { OrderDetailPage } from '@/pages/OrderDetailPage'
import { PreparationPage } from '@/pages/PreparationPage'
import { PurchasePage } from '@/pages/PurchasePage'

/**
 * 제품 · 주문 · 발주 세 메뉴가 모두 실제 화면을 가리킨다.
 *
 * **첫 화면은 제품이다.** 이 앱의 모든 판정은 '지금 창고에 무엇이 얼마나 있는가' 에서
 * 출발한다. 주문 화면의 준비상태도, 발주 화면의 부족수량도 전부 그 숫자에서 나온 결과다.
 * 결과부터 보여주면 담당자는 그 숫자를 믿을 근거를 화면에서 찾지 못한다.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/items" replace /> },
      { path: 'items', element: <InventoryPage /> },
      { path: 'orders', element: <PreparationPage /> },
      { path: 'orders/:orderId', element: <OrderDetailPage /> },
      { path: 'inbound', element: <PurchasePage /> },
      { path: '*', element: <Navigate to="/items" replace /> },
    ],
  },
])
