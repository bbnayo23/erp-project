import 'styled-components'
import type { AppTheme } from '@erp/design-system'

/**
 * 앱 쪽에도 테마 타입을 다시 붙여준다.
 * (디자인시스템의 styled.d.ts 는 그 패키지 tsconfig 범위 안에서만 적용된다)
 */
declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
