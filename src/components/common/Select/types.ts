import type { SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  /** option 을 화면마다 직접 나열하지 않도록 데이터로 받는다 */
  options: SelectOption[]
}
