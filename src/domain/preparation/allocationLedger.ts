import type {
  ErpDatabase,
  ISODateString,
  IncomingDocument,
  ItemCode,
  Quantity,
  WarehouseCode,
} from '@/types'
import { getAvailableQuantity } from '@/domain/inventory/getAvailableQuantity'
import {
  getRemainingQuantity,
  isIncomingPlanned,
  isUsableBy,
} from '@/domain/purchase/getRemainingQuantity'
import { compareIso } from '@/utils/date'

/**
 * 배정 원장 — 여러 주문이 같은 재고를 나눠 가질 때 남은 몫을 추적한다.
 *
 * 주문을 각각 독립적으로 판정하면 안 된다. 가용재고 1개를 두 주문이 각각 1개씩
 * 필요로 하면 둘 다 "준비 가능" 으로 나오지만 실제로는 한 건만 나갈 수 있다.
 * 그래서 배송일 순서대로 원장에서 덜어내며 판정한다 (가이드 §6).
 *
 * 입고예정을 문서별로 쪼개 갖는 이유: 사용 가능 여부가 주문마다 다르다. 07/24 도착
 * 예정 물량은 배송일 07/25 주문은 쓸 수 있지만 07/22 주문은 쓸 수 없다. 합계 하나로
 * 들고 있으면 이 구분이 사라진다.
 *
 * 이 객체는 의도적으로 가변이다 — 순차 배정은 본질적으로 누적 상태다. 대신 수명을
 * planPreparation 한 번의 호출 안으로 묶어, 바깥의 어떤 값도 바뀌지 않게 한다.
 * 원장을 만드는 재료(inventories·incomingDocuments)는 읽기만 한다.
 */
export interface AllocationLedger {
  /** 품목@창고 → 남은 가용재고 */
  stock: Map<string, Quantity>
  /** 품목@창고 → 문서별 남은 예정수량. 도착이 빠른 순서다. */
  incoming: Map<string, IncomingRemainder[]>
}

interface IncomingRemainder {
  document: IncomingDocument
  remaining: Quantity
}

export interface Allocation {
  /** 배정을 시도한 시점에 원장에 남아 있던 가용재고 */
  availableQuantity: Quantity
  /** 그 시점에 이 배송일로 쓸 수 있던 입고예정 잔여 합계 */
  incomingQuantity: Quantity

  allocatedFromStock: Quantity
  allocatedFromIncoming: Quantity

  /** 원장을 다 긁어도 남은 부족분 — 발주가 필요한 수량이다 */
  shortageQuantity: Quantity

  /** 실제로 잡은 입고예정 문서들 */
  documents: IncomingDocument[]
}

export type LedgerContext = Pick<ErpDatabase, 'inventories' | 'incomingDocuments'>

export const ledgerKey = (itemCode: ItemCode, warehouseCode: WarehouseCode): string =>
  `${itemCode}@${warehouseCode}`

export function createAllocationLedger(ctx: LedgerContext): AllocationLedger {
  const stock = new Map<string, Quantity>()
  for (const inventory of ctx.inventories) {
    stock.set(
      ledgerKey(inventory.itemCode, inventory.warehouseCode),
      getAvailableQuantity(inventory),
    )
  }

  const incoming = new Map<string, IncomingRemainder[]>()
  for (const document of ctx.incomingDocuments) {
    // 미확정 문서는 아직 공급처에 나가지 않은 계획이라 도착을 기대할 수 없다
    if (!isIncomingPlanned(document)) continue
    const key = ledgerKey(document.itemCode, document.warehouseCode)
    const bucket = incoming.get(key)
    const remainder: IncomingRemainder = {
      document,
      remaining: getRemainingQuantity(document),
    }
    if (bucket) bucket.push(remainder)
    else incoming.set(key, [remainder])
  }

  for (const bucket of incoming.values()) {
    bucket.sort((a, b) => compareIso(a.document.availableDate, b.document.availableDate))
  }

  return { stock, incoming }
}

/**
 * 소요량만큼 원장에서 덜어낸다.
 *
 * 가용재고를 먼저 쓰고, 모자란 만큼만 입고예정에서 당긴다. 순서가 중요하다 —
 * 입고예정을 먼저 쓰면 지금 당장 나갈 수 있는 주문이 도착을 기다리게 된다.
 *
 * 입고예정은 도착이 빠른 문서부터 쓴다. 늦게 오는 물량을 앞 주문이 잡아버리면
 * 뒤 주문은 더 늦은 배송일인데도 쓸 수 있는 문서가 사라진다.
 *
 * 부분 배정도 그대로 유지한다 — 주문 전체가 준비되지 않아도 앞선 주문의 몫은
 * 지켜져야 한다. 예약(reserveOrder)이 전량 아니면 전무인 것과는 별개다.
 */
export function allocate(
  ledger: AllocationLedger,
  itemCode: ItemCode,
  warehouseCode: WarehouseCode,
  requiredQuantity: Quantity,
  deliveryDate: ISODateString,
): Allocation {
  const key = ledgerKey(itemCode, warehouseCode)

  const availableQuantity = ledger.stock.get(key) ?? 0
  const usable = (ledger.incoming.get(key) ?? []).filter(
    (remainder) => remainder.remaining > 0 && isUsableBy(remainder.document, deliveryDate),
  )
  const incomingQuantity = usable.reduce((acc, remainder) => acc + remainder.remaining, 0)

  const allocatedFromStock = Math.min(requiredQuantity, availableQuantity)
  ledger.stock.set(key, availableQuantity - allocatedFromStock)

  let outstanding = requiredQuantity - allocatedFromStock
  let allocatedFromIncoming = 0
  const documents: IncomingDocument[] = []

  for (const remainder of usable) {
    if (outstanding <= 0) break
    const taken = Math.min(outstanding, remainder.remaining)
    remainder.remaining -= taken
    outstanding -= taken
    allocatedFromIncoming += taken
    documents.push(remainder.document)
  }

  return {
    availableQuantity,
    incomingQuantity,
    allocatedFromStock,
    allocatedFromIncoming,
    shortageQuantity: outstanding,
    documents,
  }
}
