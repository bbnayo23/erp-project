import { create } from 'zustand'
import { ApiError, toErrorMessage } from '@/shared/api/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/lib/constants'
import type { Employee, EmployeeDraft, EmployeeStatus } from '@/types/domain'
import { employeeApi } from './api'

interface Filters {
  keyword: string
  status: EmployeeStatus | 'all'
  department: string
}

interface EmployeeState {
  items: Employee[]
  departments: string[]
  total: number
  page: number
  pageSize: number
  filters: Filters
  loading: boolean
  saving: boolean
  error: string | null
  /** 서버 검증 오류 (필드명 → 메시지) */
  fieldErrors: Record<string, string>

  fetch: () => Promise<void>
  fetchDepartments: () => Promise<void>
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setFilters: (patch: Partial<Filters>) => void
  resetFilters: () => void
  create: (draft: EmployeeDraft) => Promise<boolean>
  update: (id: string, patch: Partial<Employee>) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  clearErrors: () => void
}

const INITIAL_FILTERS: Filters = { keyword: '', status: 'all', department: 'all' }

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  items: [],
  departments: [],
  total: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  filters: INITIAL_FILTERS,
  loading: false,
  saving: false,
  error: null,
  fieldErrors: {},

  fetch: async () => {
    const { page, pageSize, filters } = get()
    set({ loading: true, error: null })
    try {
      const response = await employeeApi.list({
        page,
        pageSize,
        keyword: filters.keyword || undefined,
        status: filters.status,
        department: filters.department,
      })
      set({ items: response.data, total: response.meta.total, loading: false })
    } catch (error) {
      set({ loading: false, error: toErrorMessage(error), items: [], total: 0 })
    }
  },

  fetchDepartments: async () => {
    try {
      const response = await employeeApi.departments()
      set({ departments: response.data })
    } catch {
      // 메타 조회 실패는 화면을 막지 않는다 — 필터만 비어 보인다
      set({ departments: [] })
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

  create: async (draft) => {
    set({ saving: true, error: null, fieldErrors: {} })
    try {
      await employeeApi.create(draft)
      set({ saving: false, page: 1 })
      await get().fetch()
      return true
    } catch (error) {
      set({
        saving: false,
        error: toErrorMessage(error),
        fieldErrors: error instanceof ApiError ? (error.fields ?? {}) : {},
      })
      return false
    }
  },

  update: async (id, patch) => {
    set({ saving: true, error: null, fieldErrors: {} })
    try {
      await employeeApi.update(id, patch)
      set({ saving: false })
      await get().fetch()
      return true
    } catch (error) {
      set({
        saving: false,
        error: toErrorMessage(error),
        fieldErrors: error instanceof ApiError ? (error.fields ?? {}) : {},
      })
      return false
    }
  },

  remove: async (id) => {
    set({ saving: true, error: null })
    try {
      await employeeApi.remove(id)
      set({ saving: false })
      await get().fetch()
      return true
    } catch (error) {
      set({ saving: false, error: toErrorMessage(error) })
      return false
    }
  },

  clearErrors: () => set({ error: null, fieldErrors: {} }),
}))
