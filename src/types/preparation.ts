import type { DocumentId, ItemCode, OrderId, Quantity } from './common'

/**
 * 출고 준비 판정 결과. 시트에 없는 화면 전용 모델이다.
 *
 * 주문상태(주문 확정·취소·출고 완료…)와는 완전히 다른 축이다.
 * 주문상태는 영업 진행 단계이고, 준비상태는 "지금 이 주문을 내보낼 수 있는가" 다.
 *   주문상태 = 주문 확정 / 준비상태 = WAITING / 대기원인 = QUALITY_INSPECTION
 * 처럼 동시에 성립한다.
 */
export type PreparationStatus =
  /** 가용재고로 전량 채울 수 있다 */
  | 'READY'
  /** 지금은 모자라지만 배송일 전에 도착하는 확정 입고예정으로 채워진다 */
  | 'WAITING'
  /** 입고예정까지 더해도 모자라다 — 발주·생산의뢰가 필요하다 */
  | 'SHORTAGE'
  /** 데이터가 준비 판정 자체를 할 수 없는 상태다 — 담당자 확인이 필요하다 */
  | 'EXCEPTION'

/** WAITING 인 이유 — 언제 풀릴지 판단하려면 무엇을 기다리는지 알아야 한다 */
export type PreparationWaitingReason =
  /** 생산은 끝났지만 품질검사가 남았다 */
  | 'QUALITY_INSPECTION'
  /** 생산 진행 중 */
  | 'PRODUCTION'
  /** 구매발주 입고 대기 */
  | 'PURCHASE'

/**
 * 준비를 막는 사유.
 *
 * 코드로 두면 판정 로직과 화면 문구가 분리된다. 문구를 손대도 판정이 흔들리지 않고,
 * 테스트는 문구가 아니라 코드로 검증할 수 있다.
 */
export type PreparationBlockCode =
  /** 01_품목에 없는 품목코드 (UNKNOWN-SKU) */
  | 'UNKNOWN_ITEM'
  /** 사용 중지된 출고창고 (WH-LEGACY) */
  | 'INACTIVE_WAREHOUSE'
  /** 03_창고에 없는 창고코드 */
  | 'UNKNOWN_WAREHOUSE'
  /** 수량이 0 이하 */
  | 'INVALID_QUANTITY'
  /** 주문 확정 상태가 아니어서 준비 대상이 아니다 */
  | 'ORDER_NOT_CONFIRMED'
  /** 정상 품목이 하나도 없다 (전부 취소되었거나 서비스만 남음) */
  | 'NO_DEMAND'
  /** 세트가 자기 자신을 품고 있어 전개할 수 없다 */
  | 'BUNDLE_CYCLE'
  /** 세트상품인데 02_세트구성에 구성품이 없다 */
  | 'BUNDLE_EMPTY'

export interface PreparationBlock {
  code: PreparationBlockCode
  /** 화면에 그대로 띄울 수 있는 문구 */
  message: string
  /** 품목 때문에 막힌 경우 해당 품목코드 */
  itemCode?: ItemCode
}

export interface PreparationItem {
  itemCode: ItemCode
  /** 세트를 푼 뒤의 실제 소요량 */
  requiredQuantity: Quantity

  /**
   * 이 주문 차례에 남아 있던 가용재고.
   *
   * 창고의 가용재고 총량이 아니다. 배송일이 앞선 주문이 이미 가져간 몫은 빠져 있다
   * (planPreparation). 주문 하나만 단독으로 판정하면 창고 총량과 같아진다.
   */
  availableQuantity: Quantity
  /** 이 주문 차례에 남아 있던, 배송일 전에 도착하는 확정 입고예정 잔여수량 */
  incomingQuantity: Quantity

  /** 이 주문이 가용재고에서 실제로 잡은 수량 */
  allocatedFromStock: Quantity
  /** 이 주문이 입고예정에서 실제로 잡은 수량 */
  allocatedFromIncoming: Quantity

  /** max(0, 소요량 - 가용재고 - 사용 가능한 입고예정) — 발주가 필요한 순수 부족분 */
  shortageQuantity: Quantity

  status: PreparationStatus
  waitingReason?: PreparationWaitingReason
  /** WAITING 의 근거가 된 입고예정 문서 */
  incomingDocumentIds: DocumentId[]
}

export interface OrderPreparation {
  orderId: OrderId

  /**
   * 주문 전체 판정. 한 주문은 필요한 모든 품목을 준비할 수 있을 때만 예약하므로
   * (00_안내), 품목 중 가장 나쁜 상태가 곧 주문의 상태다.
   */
  status: PreparationStatus

  items: PreparationItem[]

  /** 재고 수요에서 제외된 서비스 품목 — 빠진 게 아니라 원래 대상이 아님을 보여준다 */
  excludedItemCodes: ItemCode[]

  blockingReasons: PreparationBlock[]
}
