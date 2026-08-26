import type {
  ErpDatabase,
  ISODateString,
  IncomingDocument,
  IncomingProgressStatus,
  Item,
  Quantity,
  SerialInventory,
  SerialNumber,
} from '@/types'
import { isSerialManaged } from '@/domain/master/itemRules'
import { getRemainingQuantity, isInspectionPending } from './getRemainingQuantity'

export type ReceiveContext = Pick<ErpDatabase, 'inventories' | 'serials'>

export type ReceiveFailure =
  /** 확정되지 않은 '작성 중' 문서는 입고할 수 없다 */
  | 'NOT_CONFIRMED'
  /** 검사 대기·검사 전 수량은 아직 현재고가 될 수 없다 */
  | 'INSPECTION_PENDING'
  | 'INVALID_QUANTITY'
  /** 잔여수량을 초과한 입고 — 초과 입고는 발주서 수정이 필요한 사건이다 */
  | 'EXCEEDS_REMAINING'

export interface ReceiveIncomingInput {
  document: IncomingDocument
  item: Item
  quantity: Quantity
  receivedAt: ISODateString
  /** 신규 개체에 붙일 시리얼번호 — 호출부가 미리 만들어 넘긴다 (순수성 유지) */
  serialNumbers?: SerialNumber[]
}

export interface ReceiveIncomingResult {
  ok: boolean
  failure?: ReceiveFailure
  document: IncomingDocument
  inventories: ErpDatabase['inventories']
  serials: ErpDatabase['serials']
  createdSerialNumbers: SerialNumber[]
}

/** 입고 직후 개체가 놓이는 임시 위치. 실물 랙 주소는 적치(put-away) 단계에서 정해진다. */
export const RECEIVING_LOCATION = 'RCV-01'

const nextStatus = (document: IncomingDocument): IncomingProgressStatus =>
  document.receivedQuantity >= document.plannedQuantity ? '입고 완료' : '부분 입고'

/**
 * 입고 처리 — 창고 현재고를 늘린다.
 *
 * 예약수량은 건드리지 않는다. 예약은 주문 확정의 결과이므로, 입고로 늘어난 재고는
 * 곧 가용재고가 되어 대기 중인 주문이 다시 판정될 때 쓰인다.
 *
 * 시리얼 관리 품목은 개체 행도 함께 만든다. 그렇지 않으면 04_재고현황과 05_개체재고가
 * 어긋나 예약 시점에 배정할 개체가 없어진다.
 */
export function receiveIncoming(
  ctx: ReceiveContext,
  { document, item, quantity, receivedAt, serialNumbers = [] }: ReceiveIncomingInput,
): ReceiveIncomingResult {
  const unchanged = {
    document,
    inventories: ctx.inventories,
    serials: ctx.serials,
    createdSerialNumbers: [],
  }

  if (!document.confirmed) return { ok: false, failure: 'NOT_CONFIRMED', ...unchanged }
  if (isInspectionPending(document)) {
    return { ok: false, failure: 'INSPECTION_PENDING', ...unchanged }
  }
  if (quantity <= 0) return { ok: false, failure: 'INVALID_QUANTITY', ...unchanged }
  if (quantity > getRemainingQuantity(document)) {
    return { ok: false, failure: 'EXCEEDS_REMAINING', ...unchanged }
  }

  const received: IncomingDocument = {
    ...document,
    receivedQuantity: document.receivedQuantity + quantity,
  }

  const existing = ctx.inventories.find(
    (inventory) =>
      inventory.itemCode === document.itemCode &&
      inventory.warehouseCode === document.warehouseCode,
  )

  const inventories = existing
    ? ctx.inventories.map((inventory) =>
        inventory === existing
          ? { ...inventory, currentQuantity: inventory.currentQuantity + quantity }
          : inventory,
      )
    : [
        ...ctx.inventories,
        {
          baseAt: receivedAt,
          warehouseCode: document.warehouseCode,
          itemCode: document.itemCode,
          currentQuantity: quantity,
          reservedQuantity: 0,
        },
      ]

  const created = isSerialManaged(item) ? serialNumbers.slice(0, quantity) : []

  const newSerials: SerialInventory[] = created.map((serialNumber) => ({
    serialNumber,
    itemCode: document.itemCode,
    warehouseCode: document.warehouseCode,
    location: RECEIVING_LOCATION,
    status: '창고 보관 중',
    receivedAt,
  }))

  return {
    ok: true,
    document: { ...received, status: nextStatus(received) },
    inventories,
    serials: [...ctx.serials, ...newSerials],
    createdSerialNumbers: created,
  }
}

/** 검사 통과 처리 — 검사가 끝나야 입고할 수 있다 */
export function completeInspection(document: IncomingDocument): IncomingDocument {
  if (!isInspectionPending(document)) return document
  return { ...document, inspectionStatus: '검사 완료', status: '검사 완료' }
}
