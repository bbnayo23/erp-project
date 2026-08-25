import type { Employee, Order, Product } from '@/types/domain'
import { createEmployees, createOrders, createProducts } from './fixtures'

/**
 * 브라우저 메모리에 사는 목업 DB.
 * 새로고침하면 시드 상태로 돌아간다 (시드가 고정이라 매번 같은 데이터).
 */
class MockDatabase {
  employees: Employee[]
  products: Product[]
  orders: Order[]

  constructor() {
    this.employees = createEmployees()
    this.products = createProducts()
    this.orders = createOrders(this.products, this.employees)
  }

  nextEmployeeCode(): string {
    const max = this.employees.reduce((acc, employee) => {
      const num = Number(employee.code.replace('EMP-', ''))
      return Number.isFinite(num) && num > acc ? num : acc
    }, 0)
    return `EMP-${String(max + 1).padStart(4, '0')}`
  }

  nextId(prefix: string, list: { id: string }[]): string {
    const max = list.reduce((acc, item) => {
      const num = Number(item.id.replace(`${prefix}-`, ''))
      return Number.isFinite(num) && num > acc ? num : acc
    }, 0)
    return `${prefix}-${max + 1}`
  }
}

export const db = new MockDatabase()

export interface QueryOptions<T> {
  page: number
  pageSize: number
  keyword?: string
  /** keyword 를 대조할 필드들 */
  searchFields?: (keyof T)[]
  sort?: string
  order?: 'asc' | 'desc'
  /** 추가 필터 */
  filter?: (item: T) => boolean
}

export interface QueryResult<T> {
  items: T[]
  total: number
  totalPages: number
}

/** 검색 → 필터 → 정렬 → 페이지네이션. 목업 리스트 엔드포인트 공통 로직. */
export function queryList<T extends Record<string, unknown>>(
  source: T[],
  options: QueryOptions<T>,
): QueryResult<T> {
  const { page, pageSize, keyword, searchFields, sort, order = 'asc', filter } = options

  let rows = source

  if (filter) {
    rows = rows.filter(filter)
  }

  if (keyword && searchFields?.length) {
    const needle = keyword.trim().toLowerCase()
    rows = rows.filter((row) =>
      searchFields.some((field) =>
        String(row[field] ?? '')
          .toLowerCase()
          .includes(needle),
      ),
    )
  }

  if (sort) {
    const direction = order === 'desc' ? -1 : 1
    rows = [...rows].sort((a, b) => {
      const left = a[sort as keyof T]
      const right = b[sort as keyof T]
      if (typeof left === 'number' && typeof right === 'number') return (left - right) * direction
      return String(left ?? '').localeCompare(String(right ?? ''), 'ko') * direction
    })
  }

  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const start = (safePage - 1) * pageSize

  return {
    items: rows.slice(start, start + pageSize),
    total,
    totalPages,
  }
}

export function parseListParams(url: URL) {
  return {
    page: Number(url.searchParams.get('page') ?? 1) || 1,
    pageSize: Number(url.searchParams.get('pageSize') ?? 20) || 20,
    keyword: url.searchParams.get('keyword') ?? undefined,
    sort: url.searchParams.get('sort') ?? undefined,
    order: (url.searchParams.get('order') as 'asc' | 'desc' | null) ?? undefined,
  }
}
