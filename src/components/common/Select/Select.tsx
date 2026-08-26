import { forwardRef } from 'react'
import { Root } from './styled'
import type { SelectProps } from './types'

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, ...rest },
  ref,
) {
  return (
    <Root ref={ref} {...rest}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Root>
  )
})
