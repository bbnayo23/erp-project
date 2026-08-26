import { forwardRef } from 'react'
import { Root } from './styled'
import type { CheckboxProps } from './types'

/** label 로 감싸므로 별도 htmlFor 없이 클릭 영역이 라벨까지 확장된다 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, ...rest },
  ref,
) {
  return (
    <Root className={className}>
      <input ref={ref} type="checkbox" {...rest} />
      {label}
    </Root>
  )
})
