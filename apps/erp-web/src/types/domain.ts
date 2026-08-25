export type EmployeeStatus = 'active' | 'leave' | 'resigned'

export interface Employee {
  id: string
  code: string
  name: string
  email: string
  phone: string
  department: string
  position: string
  status: EmployeeStatus
  hiredAt: string
  salary: number
}

export type EmployeeDraft = Omit<Employee, 'id' | 'code'> & { code?: string }

export type ProductStatus = 'selling' | 'soldout' | 'discontinued'

export interface Product {
  id: string
  sku: string
  name: string
  category: string
  unit: string
  price: number
  cost: number
  stock: number
  safetyStock: number
  status: ProductStatus
  updatedAt: string
}

export type ProductDraft = Omit<Product, 'id' | 'updatedAt'>

export type OrderStatus = 'draft' | 'confirmed' | 'shipped' | 'done' | 'canceled'

export interface OrderLine {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export interface Order {
  id: string
  orderNo: string
  customer: string
  orderedAt: string
  dueAt: string
  status: OrderStatus
  lines: OrderLine[]
  totalAmount: number
  owner: string
}

export interface DashboardSummary {
  revenueThisMonth: number
  revenueGrowthRate: number
  openOrders: number
  lowStockCount: number
  activeEmployees: number
  monthlyRevenue: { month: string; amount: number }[]
  recentOrders: Pick<
    Order,
    'id' | 'orderNo' | 'customer' | 'status' | 'totalAmount' | 'orderedAt'
  >[]
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'staff'
  department: string
}
