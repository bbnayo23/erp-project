import type { InputHTMLAttributes } from 'react'

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 숫자 입력처럼 자릿수를 맞춰야 하는 경우 우측 정렬 + tabular-nums */
  numeric?: boolean
}
