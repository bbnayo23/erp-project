import type { BundleComponent } from './bundle'
import type { IncomingDocument } from './incoming'
import type { Inventory } from './inventory'
import type { Item } from './item'
import type { Order } from './order'
import type { ProcessedRequest } from './request'
import type { Reservation } from './reservation'
import type { SerialInventory } from './serial'
import type { Shipment } from './shipment'
import type { Supplier } from './supplier'
import type { Warehouse } from './warehouse'
import type { ISODateString } from './common'

/**
 * 인메모리 데이터베이스 전체 모양.
 *
 * 도메인 함수는 필요한 컬렉션만 `Pick<ErpDatabase, ...>` 로 받는다.
 * 시그니처만 봐도 그 함수가 무엇을 읽는지 드러나고, 테스트에서 넘겨야 할 것도 최소가 된다.
 */
export interface ErpDatabase {
  items: Item[]
  bundleComponents: BundleComponent[]
  warehouses: Warehouse[]
  inventories: Inventory[]
  serials: SerialInventory[]
  orders: Order[]
  incomingDocuments: IncomingDocument[]
  suppliers: Supplier[]
  /** 앱이 만든 예약 — 시트에는 없다 */
  reservations: Reservation[]
  /** 앱이 만든 출고 이력 — 시트에는 없다 */
  shipments: Shipment[]
  /** 재고를 바꾼 요청의 처리 이력 — 반복 요청을 막는 근거다 */
  processedRequests: ProcessedRequest[]
  /** 04_재고현황 기준시각. 준비 판정과 납기 계산의 '오늘' 이다. */
  baseAt: ISODateString
}
