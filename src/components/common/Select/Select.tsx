import { forwardRef } from 'react'
import { Icon } from '@/components/common/Icon'
import { Arrow, Field, Root } from './styled'
import type { SelectProps } from './types'

/**
 * 셀렉트.
 *
 * 네이티브 화살표를 지우고(`appearance: none`) 직접 그린 화살표를 얹는다. 브라우저가
 * 자기 컨트롤을 그리게 두면 `border-radius` · `color` · `height` 를 부분적으로만
 * 반영해서, 같은 코드가 플랫폼마다 다른 모서리와 글자색으로 나온다.
 *
 * `className` 은 감싼 박스로 간다 — 폭을 잡아야 하는 쪽이 바깥이다.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, className, ...rest },
  ref,
) {
  return (
    <Root className={className}>
      <Field ref={ref} {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Field>
      <Arrow>
        <Icon name="chevronDown" size={16} />
      </Arrow>
    </Root>
  )
})
