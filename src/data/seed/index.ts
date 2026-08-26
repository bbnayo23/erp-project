/**
 * 엑셀 예시 데이터(재고흐름ERP과제_example-data_실무형_v2.xlsx)를 시트별로 옮긴 것.
 *
 * 각 파일은 시트 하나와 1:1 이다. 엑셀을 다시 내보내도 같은 자리에 대응되므로
 * 실제 데이터로 교체하기 쉽다.
 *
 * 엑셀 원본에서 손댄 것은 두 가지뿐이다.
 *   - 날짜: 엑셀 float 오차로 생긴 .999999 / .000001 꼬리를 초 단위로 반올림하고
 *           기준 타임존(Asia/Seoul)을 명시했다. 15:59:59.999999 → 16:00:00+09:00
 *   - 예/아니오: 시리얼관리여부·출고대상여부·확정여부는 boolean 으로 바꿨다.
 *     나머지 한글 상태값(주문상태·개체상태·진행상태 등)은 화면에 그대로 노출되므로 유지한다.
 */
export { SEED_ITEMS } from './items'
export { SEED_BUNDLE_COMPONENTS } from './bundles'
export { SEED_WAREHOUSES } from './warehouses'
export { SEED_INVENTORIES } from './inventories'
export { SEED_SERIALS } from './serials'
export { SEED_ORDER_ROWS } from './orders'
export { SEED_INCOMING_DOCUMENTS } from './incoming'
export { SEED_SUPPLIERS } from './suppliers'

/**
 * 00_안내 시트의 기준시각.
 * 04_재고현황의 모든 행이 이 시각 기준이고, 준비 판정·납기 계산의 '오늘' 이다.
 */
export const SEED_BASE_AT = '2026-07-21T09:00:00+09:00'
