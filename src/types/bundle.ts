import type { ItemCode, Quantity } from './common'

/**
 * 02_세트구성 한 행.
 *
 * 세트상품을 실제로 무엇으로 채우는지 정의한다. 세트 자체는 재고를 갖지 않는다.
 */
export interface BundleComponent {
  bundleItemCode: ItemCode
  componentItemCode: ItemCode
  quantity: Quantity

  /**
   * 02_세트구성 출고대상여부.
   * false 인 구성품(설치·수거 서비스)은 재고 수요에서 제외한다.
   */
  isOutboundTarget: boolean
}
