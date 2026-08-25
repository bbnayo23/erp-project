/** 서버 응답 봉투 — 목업과 실제 API 가 같은 모양을 쓰도록 고정한다. */
export interface ApiResponse<T> {
  data: T
}

export interface PageMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PagedResponse<T> {
  data: T[]
  meta: PageMeta
}

export interface ApiErrorBody {
  message: string
  code?: string
  /** 필드 단위 검증 오류 */
  fields?: Record<string, string>
}

export interface ListParams {
  page?: number
  pageSize?: number
  /** 통합 검색어 */
  keyword?: string
  sort?: string
  order?: 'asc' | 'desc'
}
