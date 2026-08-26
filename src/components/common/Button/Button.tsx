import { forwardRef } from 'react'
import { ButtonRoot, IconButtonRoot } from './styled'
import type { ButtonProps, IconButtonProps } from './types'

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    leftIcon,
    rightIcon,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <ButtonRoot
      ref={ref}
      type={type}
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </ButtonRoot>
  )
})

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', size = 'md', children, type = 'button', ...rest },
  ref,
) {
  return (
    <IconButtonRoot
      ref={ref}
      type={type}
      $variant={variant}
      $size={size}
      $fullWidth={false}
      {...rest}
    >
      {children}
    </IconButtonRoot>
  )
})
