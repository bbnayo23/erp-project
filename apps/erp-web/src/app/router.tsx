import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { EmployeesPage } from '@/features/employees/EmployeesPage'
import { ProductsPage } from '@/features/products/ProductsPage'
import { OrdersPage } from '@/features/orders/OrdersPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { NotFoundPage } from '@/features/misc/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'employees', element: <EmployeesPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
