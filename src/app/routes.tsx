import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { InventoryPage } from '@/pages/InventoryPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { PurchasePage } from '@/pages/PurchasePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // 진입점은 재고 — 다른 모든 판단이 재고에서 시작한다
      { index: true, element: <Navigate to="/inventory" replace /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'purchase', element: <PurchasePage /> },
      { path: '*', element: <Navigate to="/inventory" replace /> },
    ],
  },
])
