import { HttpResponse, delay, http } from 'msw'
import type {
  DashboardSummary,
  Employee,
  EmployeeDraft,
  Order,
  Product,
  ProductDraft,
  User,
} from '@/types/domain'
import type { ApiErrorBody, PagedResponse } from '@/shared/api/types'
import { db, parseListParams, queryList } from './db'

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'
const LATENCY = Number(import.meta.env.VITE_MOCK_LATENCY ?? 300)

const url = (path: string) => `${BASE}${path}`

const paged = <T>(items: T[], total: number, page: number, pageSize: number): PagedResponse<T> => ({
  data: items,
  meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
})

const fail = (status: number, body: ApiErrorBody) => HttpResponse.json(body, { status })

const CURRENT_USER: User = {
  id: 'usr-1',
  name: '박나영',
  email: 'nayeong.park@igloo.co.kr',
  role: 'admin',
  department: '경영지원',
}

export const handlers = [
  /* ---------------------------------------------------------------- auth */
  http.get(url('/me'), async () => {
    await delay(LATENCY)
    return HttpResponse.json({ data: CURRENT_USER })
  }),

  http.post(url('/auth/login'), async ({ request }) => {
    await delay(LATENCY)
    const body = (await request.json()) as { email?: string; password?: string }

    if (!body.email || !body.password) {
      return fail(400, { message: '이메일과 비밀번호를 모두 입력해 주세요.' })
    }
    if (body.password !== 'erp1234') {
      return fail(401, { message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    }

    return HttpResponse.json({
      data: { user: { ...CURRENT_USER, email: body.email }, token: 'mock-access-token' },
    })
  }),

  /* ----------------------------------------------------------- employees */
  http.get(url('/employees'), async ({ request }) => {
    await delay(LATENCY)
    const requestUrl = new URL(request.url)
    const params = parseListParams(requestUrl)
    const status = requestUrl.searchParams.get('status')
    const department = requestUrl.searchParams.get('department')

    const result = queryList<Employee & Record<string, unknown>>(
      db.employees as (Employee & Record<string, unknown>)[],
      {
        page: params.page,
        pageSize: params.pageSize,
        keyword: params.keyword,
        searchFields: ['name', 'code', 'email', 'department', 'position'],
        sort: params.sort,
        order: params.order,
        filter: (employee) =>
          (!status || status === 'all' || employee.status === status) &&
          (!department || department === 'all' || employee.department === department),
      },
    )

    return HttpResponse.json(paged(result.items, result.total, params.page, params.pageSize))
  }),

  http.get(url('/employees/:id'), async ({ params }) => {
    await delay(LATENCY)
    const employee = db.employees.find((item) => item.id === params.id)
    if (!employee) return fail(404, { message: '사원을 찾을 수 없습니다.' })
    return HttpResponse.json({ data: employee })
  }),

  http.post(url('/employees'), async ({ request }) => {
    await delay(LATENCY)
    const draft = (await request.json()) as EmployeeDraft

    const fields: Record<string, string> = {}
    if (!draft.name?.trim()) fields.name = '사원명을 입력해 주세요.'
    if (!draft.department?.trim()) fields.department = '부서를 선택해 주세요.'
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      fields.email = '이메일 형식이 올바르지 않습니다.'
    }
    if (Object.keys(fields).length > 0) {
      return fail(422, { message: '입력값을 확인해 주세요.', code: 'VALIDATION_ERROR', fields })
    }

    const employee: Employee = {
      ...draft,
      id: db.nextId('emp', db.employees),
      code: draft.code?.trim() || db.nextEmployeeCode(),
    }

    db.employees = [employee, ...db.employees]
    return HttpResponse.json({ data: employee }, { status: 201 })
  }),

  http.put(url('/employees/:id'), async ({ params, request }) => {
    await delay(LATENCY)
    const index = db.employees.findIndex((item) => item.id === params.id)
    if (index < 0) return fail(404, { message: '사원을 찾을 수 없습니다.' })

    const patch = (await request.json()) as Partial<Employee>
    const updated = { ...(db.employees[index] as Employee), ...patch, id: String(params.id) }
    db.employees = db.employees.map((item, i) => (i === index ? updated : item))

    return HttpResponse.json({ data: updated })
  }),

  http.delete(url('/employees/:id'), async ({ params }) => {
    await delay(LATENCY)
    const exists = db.employees.some((item) => item.id === params.id)
    if (!exists) return fail(404, { message: '사원을 찾을 수 없습니다.' })

    db.employees = db.employees.filter((item) => item.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  /* ------------------------------------------------------------ products */
  http.get(url('/products'), async ({ request }) => {
    await delay(LATENCY)
    const requestUrl = new URL(request.url)
    const params = parseListParams(requestUrl)
    const category = requestUrl.searchParams.get('category')
    const status = requestUrl.searchParams.get('status')
    const lowStock = requestUrl.searchParams.get('lowStock') === 'true'

    const result = queryList<Product & Record<string, unknown>>(
      db.products as (Product & Record<string, unknown>)[],
      {
        page: params.page,
        pageSize: params.pageSize,
        keyword: params.keyword,
        searchFields: ['name', 'sku', 'category'],
        sort: params.sort,
        order: params.order,
        filter: (product) =>
          (!category || category === 'all' || product.category === category) &&
          (!status || status === 'all' || product.status === status) &&
          (!lowStock || product.stock <= product.safetyStock),
      },
    )

    return HttpResponse.json(paged(result.items, result.total, params.page, params.pageSize))
  }),

  http.get(url('/products/:id'), async ({ params }) => {
    await delay(LATENCY)
    const product = db.products.find((item) => item.id === params.id)
    if (!product) return fail(404, { message: '품목을 찾을 수 없습니다.' })
    return HttpResponse.json({ data: product })
  }),

  http.post(url('/products'), async ({ request }) => {
    await delay(LATENCY)
    const draft = (await request.json()) as ProductDraft

    if (!draft.name?.trim() || !draft.sku?.trim()) {
      return fail(422, {
        message: '입력값을 확인해 주세요.',
        code: 'VALIDATION_ERROR',
        fields: {
          ...(draft.name?.trim() ? {} : { name: '품목명을 입력해 주세요.' }),
          ...(draft.sku?.trim() ? {} : { sku: 'SKU 를 입력해 주세요.' }),
        },
      })
    }

    if (db.products.some((item) => item.sku === draft.sku)) {
      return fail(409, {
        message: '이미 등록된 SKU 입니다.',
        fields: { sku: '중복된 SKU 입니다.' },
      })
    }

    const product: Product = {
      ...draft,
      id: db.nextId('prd', db.products),
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    db.products = [product, ...db.products]
    return HttpResponse.json({ data: product }, { status: 201 })
  }),

  http.put(url('/products/:id'), async ({ params, request }) => {
    await delay(LATENCY)
    const index = db.products.findIndex((item) => item.id === params.id)
    if (index < 0) return fail(404, { message: '품목을 찾을 수 없습니다.' })

    const patch = (await request.json()) as Partial<Product>
    const updated: Product = {
      ...(db.products[index] as Product),
      ...patch,
      id: String(params.id),
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    db.products = db.products.map((item, i) => (i === index ? updated : item))
    return HttpResponse.json({ data: updated })
  }),

  http.delete(url('/products/:id'), async ({ params }) => {
    await delay(LATENCY)
    db.products = db.products.filter((item) => item.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  /* -------------------------------------------------------------- orders */
  http.get(url('/orders'), async ({ request }) => {
    await delay(LATENCY)
    const requestUrl = new URL(request.url)
    const params = parseListParams(requestUrl)
    const status = requestUrl.searchParams.get('status')

    const result = queryList<Order & Record<string, unknown>>(
      db.orders as (Order & Record<string, unknown>)[],
      {
        page: params.page,
        pageSize: params.pageSize,
        keyword: params.keyword,
        searchFields: ['orderNo', 'customer', 'owner'],
        sort: params.sort ?? 'orderedAt',
        order: params.order ?? 'desc',
        filter: (order) => !status || status === 'all' || order.status === status,
      },
    )

    return HttpResponse.json(paged(result.items, result.total, params.page, params.pageSize))
  }),

  http.get(url('/orders/:id'), async ({ params }) => {
    await delay(LATENCY)
    const order = db.orders.find((item) => item.id === params.id)
    if (!order) return fail(404, { message: '주문을 찾을 수 없습니다.' })
    return HttpResponse.json({ data: order })
  }),

  /* ----------------------------------------------------------- dashboard */
  http.get(url('/dashboard/summary'), async () => {
    await delay(LATENCY)

    const monthlyRevenue = ['3월', '4월', '5월', '6월', '7월', '8월'].map((month, index) => {
      const bucket = db.orders.filter(
        (order) => order.status !== 'canceled' && Number(order.orderedAt.slice(5, 7)) === index + 3,
      )
      return {
        month,
        amount: bucket.reduce((sum, order) => sum + order.totalAmount, 0),
      }
    })

    const current = monthlyRevenue.at(-1)?.amount ?? 0
    const previous = monthlyRevenue.at(-2)?.amount ?? 0

    const summary: DashboardSummary = {
      revenueThisMonth: current,
      revenueGrowthRate: previous === 0 ? 0 : ((current - previous) / previous) * 100,
      openOrders: db.orders.filter(
        (order) => order.status === 'confirmed' || order.status === 'shipped',
      ).length,
      lowStockCount: db.products.filter((product) => product.stock <= product.safetyStock).length,
      activeEmployees: db.employees.filter((employee) => employee.status === 'active').length,
      monthlyRevenue,
      recentOrders: [...db.orders]
        .sort((a, b) => b.orderedAt.localeCompare(a.orderedAt))
        .slice(0, 6)
        .map(({ id, orderNo, customer, status, totalAmount, orderedAt }) => ({
          id,
          orderNo,
          customer,
          status,
          totalAmount,
          orderedAt,
        })),
    }

    return HttpResponse.json({ data: summary })
  }),

  /* ---------------------------------------------------------- meta lists */
  http.get(url('/meta/departments'), async () => {
    await delay(80)
    const departments = [...new Set(db.employees.map((employee) => employee.department))].sort()
    return HttpResponse.json({ data: departments })
  }),

  http.get(url('/meta/categories'), async () => {
    await delay(80)
    const categories = [...new Set(db.products.map((product) => product.category))].sort()
    return HttpResponse.json({ data: categories })
  }),
]
