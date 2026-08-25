import { apiClient } from '@/shared/api/client'
import type { ApiResponse, ListParams, PagedResponse } from '@/shared/api/types'
import type { Product, ProductDraft, ProductStatus } from '@/types/domain'

export interface ProductListParams extends ListParams {
  category?: string | 'all'
  status?: ProductStatus | 'all'
  lowStock?: boolean
}

export const productApi = {
  list: (params: ProductListParams) =>
    apiClient.get<PagedResponse<Product>>('/products', { query: { ...params } }),

  detail: (id: string) => apiClient.get<ApiResponse<Product>>(`/products/${id}`),

  create: (draft: ProductDraft) => apiClient.post<ApiResponse<Product>>('/products', draft),

  update: (id: string, patch: Partial<Product>) =>
    apiClient.put<ApiResponse<Product>>(`/products/${id}`, patch),

  remove: (id: string) => apiClient.delete<void>(`/products/${id}`),

  categories: () => apiClient.get<ApiResponse<string[]>>('/meta/categories'),
}
