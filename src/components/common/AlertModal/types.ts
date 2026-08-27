import type { ReactNode } from 'react'

/**
 * 경고의 성격.
 *
 * danger 는 되돌릴 수 없는 일(입력한 값을 버림), warning 은 되돌릴 수 있지만 확인이
 * 필요한 일이다. 아이콘은 같은 세모 느낌표를 쓰고 색만 가른다 — 모양까지 다르면
 * 담당자가 두 창을 다른 종류의 사건으로 읽는다.
 */
export type AlertTone = 'danger' | 'warning'

export interface AlertModalProps {
  open: boolean

  /** 무엇이 일어나는지 — '저장하지 않고 나갑니다' */
  title: ReactNode
  /** 왜 물어보는지 · 무엇을 잃는지 */
  description?: ReactNode

  tone?: AlertTone

  /**
   * 진행 버튼 문구. 기본 '확인'.
   *
   * 무엇이 일어나는지 적을 수 있으면 적는다 — '나가기' · '저장' 처럼. '확인' 은
   * 무엇을 확인하는지 말하지 않아 마지막 수단이다.
   */
  confirmLabel?: string
  /** 물러나는 버튼 문구. 기본 '취소' */
  cancelLabel?: string

  onConfirm: () => void
  /** 딤 클릭 · ESC · 취소 버튼이 모두 이걸 부른다 */
  onCancel: () => void
}
