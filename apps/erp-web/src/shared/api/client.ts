import type { ApiErrorBody } from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number
  readonly code: string | undefined
  readonly fields: Record<string, string> | undefined

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = status
    this.code = body.code
    this.fields = body.fields
  }
}

export type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  query?: Record<string, QueryValue>
  body?: unknown
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return url

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.append(key, String(value))
  }

  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, headers, ...rest } = options

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...rest,
  })

  if (response.status === 204) return undefined as T

  const text = await response.text()
  const payload: unknown = text ? JSON.parse(text) : null

  if (!response.ok) {
    const errorBody: ApiErrorBody =
      payload && typeof payload === 'object' && 'message' in payload
        ? (payload as ApiErrorBody)
        : { message: `요청에 실패했습니다. (HTTP ${response.status})` }
    throw new ApiError(response.status, errorBody)
  }

  return payload as T
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
}

/** UI 에서 바로 쓸 수 있는 에러 메시지로 변환 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return '알 수 없는 오류가 발생했습니다.'
}
