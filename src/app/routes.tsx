import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { InventoryPage } from '@/pages/InventoryPage'
import { IssuePage } from '@/pages/IssuePage'
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
      // 품목 서랍도 URL 에 반영한다 — 다른 화면에서 '이 품목 보기' 로 건너올 수 있어야 한다
      { path: 'items/:itemKey', element: <InventoryPage /> },
      { path: 'orders', element: <PreparationPage /> },
      { path: 'orders/:orderId', element: <OrderDetailPage /> },
      { path: 'inbound', element: <PurchasePage /> },
      // 폼이 열리는 자리는 하나다 — 주문 상세의 부족 품목에서 넘어온다
      { path: 'inbound/new', element: <IssuePage /> },
      // 문서 상세는 URL 에 반영한다 — 다른 화면에서 '이 문서 보기' 로 건너올 수 있어야 한다
      { path: 'inbound/:documentId', element: <PurchasePage /> },
      { path: '*', element: <Navigate to="/items" replace /> },
    ],
  },
])
