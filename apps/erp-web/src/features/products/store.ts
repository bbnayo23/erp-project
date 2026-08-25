import { create } from 'zustand'
import { toErrorMessage } from '@/shared/api/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/lib/constants'
import type { Product, ProductStatus } from '@/types/domain'
import { productApi } from './api'

interface Filters {
  keyword: string
  category: string
  status: ProductStatus | 'all'
  lowStock: boolean
}

interface ProductState {
  items: Product[]
  categories: string[]
  total: number
  page: number
  pageSize: number
  filters: Filters
  loading: boolean
  error: string | null

  fetch: () => Promise<void>
  fetchCategories: () => Promise<void>
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setFilters: (patch: Partial<Filters>) => void
  resetFilters: () => void
}

const INITIAL_FILTERS: Filters = { keyword: '', category: 'all', status: 'all', lowStock: false }

export const useProductStore = create<ProductState>((set, get) => ({
  items: [],
  categories: [],
  total: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  filters: INITIAL_FILTERS,
  loading: false,
  error: null,

  fetch: async () => {
    const { page, pageSize, filters } = get()
    set({ loading: true, error: null })
    try {
      const response = await productApi.list({
        page,
        pageSize,
        keyword: filters.keyword || undefined,
        category: filters.category,
        status: filters.status,
        lowStock: filters.lowStock || undefined,
      })
      set({ items: response.data, total: response.meta.total, loading: false })
    } catch (error) {
      set({ loading: false, error: toErrorMessage(error), items: [], total: 0 })
    }
  },

  fetchCategories: async () => {
    try {
      const response = await productApi.categories()
      set({ categories: response.data })
    } catch {
      set({ categories: [] })
    }
  },

  setPage: (page) => {
    set({ page })
    void get().fetch()
  },

  setPageSize: (pageSize) => {
    set({ pageSize, page: 1 })
    void get().fetch()
  },

  setFilters: (patch) => {
    set((state) => ({ filters: { ...state.filters, ...patch }, page: 1 }))
    void get().fetch()
  },

  resetFilters: () => {
    set({ filters: INITIAL_FILTERS, page: 1 })
    void get().fetch()
  },
}))
