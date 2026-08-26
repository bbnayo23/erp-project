import type { ItemCode, SupplierCode } from './common'

/** 01_품목 분류 */
export type ItemCategory = '매트리스' | '프레임' | '침구' | '베개' | '결합제품' | '서비스'

/** 01_품목 품목유형 */
export type ItemType = '생산품' | '매입품' | '세트상품' | '서비스'

/** 01_품목 규격 */
export type ItemSpec = 'Q' | 'K' | 'SS' | 'STD'

export interface Item {
  itemCode: ItemCode
  itemName: string

  category: ItemCategory
  /** 서비스 품목은 규격 칸이 비어 있다 (SVC-INSTALL, SVC-DISPOSAL) */
  specification?: ItemSpec

  itemType: ItemType

  /**
   * 01_품목 시리얼관리여부.
   * 시트는 '예'/'아니오' 지만 앱에서는 boolean 으로 들고 있는다 — 조건문마다
   * 문자열을 비교하면 오타가 타입으로 걸리지 않는다.
   * 매트리스·프레임만 true 다.
   */
  serialManaged: boolean

  /** 세트상품·서비스에는 기본공급처가 없다 */
  defaultSupplierCode?: SupplierCode
}
