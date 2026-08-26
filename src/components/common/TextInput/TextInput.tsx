import { forwardRef } from 'react'
import { Input } from './styled'
import type { TextInputProps } from './types'

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { numeric = false, ...rest },
  ref,
) {
  return <Input ref={ref} $numeric={numeric} {...rest} />
})
