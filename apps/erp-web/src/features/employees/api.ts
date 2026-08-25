import { apiClient } from '@/shared/api/client'
import type { ApiResponse, ListParams, PagedResponse } from '@/shared/api/types'
import type { Employee, EmployeeDraft, EmployeeStatus } from '@/types/domain'

export interface EmployeeListParams extends ListParams {
  status?: EmployeeStatus | 'all'
  department?: string | 'all'
}

export const employeeApi = {
  list: (params: EmployeeListParams) =>
    apiClient.get<PagedResponse<Employee>>('/employees', { query: { ...params } }),

  detail: (id: string) => apiClient.get<ApiResponse<Employee>>(`/employees/${id}`),

  create: (draft: EmployeeDraft) => apiClient.post<ApiResponse<Employee>>('/employees', draft),

  update: (id: string, patch: Partial<Employee>) =>
    apiClient.put<ApiResponse<Employee>>(`/employees/${id}`, patch),

  remove: (id: string) => apiClient.delete<void>(`/employees/${id}`),

  departments: () => apiClient.get<ApiResponse<string[]>>('/meta/departments'),
}
