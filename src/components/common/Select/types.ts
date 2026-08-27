import type { SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  /** option 을 화면마다 직접 나열하지 않도록 데이터로 받는다 */
  options: SelectOption[]
  /**
   * 감싼 박스에 붙는다. 셀렉트가 아니라 바깥 박스가 폭을 잡기 때문이다 —
   * 화살표를 절대 배치하려면 기준 박스가 있어야 하고, 그 박스가 레이아웃 단위다.
   */
  className?: string
}
