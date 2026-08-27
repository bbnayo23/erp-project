import type { ReactNode } from 'react'

/**
 * 토스트의 성격.
 *
 * 배지·레일과 같은 색 어휘를 쓰되 info 를 더 둔다 — '이미 처리된 요청입니다' 처럼 실패도
 * 성공도 아닌 결과가 있다. 그것을 빨갛게 띄우면 담당자가 무언가 잘못한 줄 안다.
 */
export type ToastTone = 'success' | 'danger' | 'info'

export interface ToastOptions {
  tone?: ToastTone
  /** 본문 아래 한 줄 — 무엇이 어떻게 바뀌었는지 */
  description?: ReactNode
  /** ms. 0 이면 자동으로 닫지 않는다 (실패는 담당자가 읽고 닫아야 한다) */
  duration?: number
}

export interface ToastItem extends ToastOptions {
  id: number
  message: ReactNode
  tone: ToastTone
  duration: number
}

/**
 * 화면이 쓰는 토스트 API.
 *
 * `show` 하나로 두지 않고 결과별 함수를 둔 이유: 호출부가 tone 을 매번 고르면 같은
 * 성격의 결과가 화면마다 다른 색으로 뜬다.
 */
export interface ToastApi {
  /** 저장 · 완료 — '저장되었습니다' */
  success: (message: ReactNode, options?: ToastOptions) => void
  /** 처리하지 못했다 */
  danger: (message: ReactNode, options?: ToastOptions) => void
  /** 이미 되어 있다 · 바뀐 것이 없다 */
  info: (message: ReactNode, options?: ToastOptions) => void
  dismiss: (id: number) => void
}
