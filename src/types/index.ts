/**
 * 엔티티 타입의 단일 출처.
 *
 * 파일은 엑셀 시트 단위로 나눈다 (item = 01_품목, bundle = 02_세트구성 …).
 * 시트가 없는 네 개는 앱 확장이다.
 *   - reservation: 예약을 주문별로 추적하기 위한 엔티티
 *   - shipment: 출고 이력 — 무엇을 어느 개체로 내보냈는지
 *   - request: 재고를 바꾼 요청의 처리 이력 (멱등성 근거)
 *   - preparation: 출고 준비 판정 결과 (화면 전용 모델)
 *
 * 이 계층은 선언만 담는다. 규칙(가용재고 계산, 창고 사용 여부 판정 등)은
 * domain/ 에 둔다 — 같은 지식이 두 곳에 흩어지지 않게 한다.
 */
export * from './common'
export * from './item'
export * from './bundle'
export * from './warehouse'
export * from './inventory'
export * from './serial'
export * from './order'
export * from './incoming'
export * from './supplier'
export * from './reservation'
export * from './shipment'
export * from './request'
export * from './preparation'
export * from './dataset'
