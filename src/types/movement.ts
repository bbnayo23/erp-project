import type {
  DocumentId,
  ISODateString,
  ItemCode,
  OrderId,
  Quantity,
  WarehouseCode,
} from './common'

/**
 * 재고가 움직인 이유. 시트에는 없는 앱 확장 엔티티다.
 *
 * 예약은 현재고를 건드리지 않고 예약수량만 올린다. 출고는 둘 다 내린다. 입고는 현재고만
 * 올린다 — 세 동작이 서로 다른 칸을 움직이므로, 숫자만 보고는 무엇 때문에 바뀌었는지
 * 되짚을 수 없다.
 */
export type StockMovementKind = 'RESERVE' | 'RELEASE' | 'SHIP' | 'RECEIVE'

/**
 * 재고 변동 이력 한 줄 — 품목 × 창고 하나가 한 요청으로 얼마나 움직였는가.
 *
 * 변화량과 변화 후 잔액을 함께 남긴다. 담당자가 화면의 현재 숫자에서 거꾸로 짚어
 * 검산할 수 있어야 하기 때문이다.
 *
 * 이력은 스토어 액션이 재고 컬렉션을 통째로 바꾼 뒤 앞뒤를 비교해 만든다
 * (domain/inventory/recordMovements). 도메인 함수마다 이력을 따로 쓰면 한 곳을
 * 빠뜨렸을 때 이력이 조용히 비는데, 그러면 이력을 믿을 수 없다.
 */
export interface StockMovement {
  /** `요청ID:품목:창고` — 같은 요청이 두 번 반영되지 않았음을 이력에서도 확인할 수 있다 */
  movementId: string
  kind: StockMovementKind

  itemCode: ItemCode
  warehouseCode: WarehouseCode

  /** 현재고 변화량 (+ 입고, − 출고, 예약은 0) */
  currentDelta: Quantity
  /** 예약수량 변화량 (+ 예약, − 출고·해제) */
  reservedDelta: Quantity

  /** 변화 후 현재고 */
  currentQuantity: Quantity
  /** 변화 후 예약수량 */
  reservedQuantity: Quantity

  /** 예약·출고를 일으킨 주문 */
  orderId?: OrderId
  /** 입고를 일으킨 발주·생산의뢰 문서 */
  documentId?: DocumentId

  occurredAt: ISODateString
}
