/**
 * 02_세트구성 (8행).
 *
 * isOutboundTarget=false 인 구성품(설치·수거 서비스)은 재고 수요에서 제외된다.
 * 세트 안에 세트가 들어오는 경우는 이 데이터에 없다.
 */

import type { BundleComponent } from '@/types'

export const SEED_BUNDLE_COMPONENTS: BundleComponent[] = [
  {
    bundleItemCode: 'SET-Z10-DMN-Q',
    componentItemCode: 'MAT-Z10-Q',
    quantity: 1,
    isOutboundTarget: true,
  },
  {
    bundleItemCode: 'SET-Z10-DMN-Q',
    componentItemCode: 'FRM-DMN-Q',
    quantity: 1,
    isOutboundTarget: true,
  },
  {
    bundleItemCode: 'SET-Z10-DMN-Q',
    componentItemCode: 'SVC-INSTALL',
    quantity: 1,
    isOutboundTarget: false,
  },
  {
    bundleItemCode: 'SET-Z10-DMN-K',
    componentItemCode: 'MAT-Z10-K',
    quantity: 1,
    isOutboundTarget: true,
  },
  {
    bundleItemCode: 'SET-Z10-DMN-K',
    componentItemCode: 'FRM-DMN-K',
    quantity: 1,
    isOutboundTarget: true,
  },
  {
    bundleItemCode: 'SET-Z10-DMN-K',
    componentItemCode: 'CVR-WP-K',
    quantity: 1,
    isOutboundTarget: true,
  },
  {
    bundleItemCode: 'SET-Z10-DMN-K',
    componentItemCode: 'SVC-INSTALL',
    quantity: 1,
    isOutboundTarget: false,
  },
  {
    bundleItemCode: 'SET-Z10-DMN-K',
    componentItemCode: 'SVC-DISPOSAL',
    quantity: 1,
    isOutboundTarget: false,
  },
]
