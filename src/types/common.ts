/**
 * 시트 전반에서 공유하는 원시 타입.
 *
 * 코드 계열을 별칭으로 둔 이유: `Map<ItemCode, Item>` 처럼 시그니처만 보고
 * 무엇을 키로 쓰는지 알 수 있다. 런타임에는 그냥 string 이다.
 */

/** 엑셀은 Date 로 주지만 API 를 고려해 문자열로 다룬다 — '2026-07-21T09:00:00+09:00' */
export type ISODateString = string

export type Quantity = number

export type ItemCode = string
export type WarehouseCode = string
export type OrderId = string
export type SerialNumber = string
export type SupplierCode = string
export type DocumentId = string
