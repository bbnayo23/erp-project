import type {
  DocumentId,
  Inventory,
  ISODateString,
  OrderId,
  StockMovement,
  StockMovementKind,
} from '@/types'

/**
 * 재고 컬렉션의 앞뒤를 비교해 변동 이력을 만든다.
 *
 * 이력을 도메인 함수 안에서 쓰지 않는 이유: 예약·출고·입고가 각자 이력을 남기면
 * 한 곳을 빠뜨렸을 때 이력이 조용히 빈다. 재고를 바꾸는 길이 스토어 액션 하나뿐이므로
 * (트랜잭션 경계), 그 자리에서 앞뒤를 한 번 비교하면 빠질 길이 없다.
 *
 * 04_재고현황에 없던 조합이 입고로 새로 생기는 경우가 있어 before 를 기준으로 돌지 않고
 * after 를 기준으로 돈다. 재고 행이 사라지는 동작은 없다.
 */
export interface MovementContext {
  kind: StockMovementKind
  /** 멱등성 키. 이력 ID 의 앞부분이 되어 같은 요청이 두 줄을 남기지 않게 한다. */
  requestId: string
  occurredAt: ISODateString
  orderId?: OrderId
  documentId?: DocumentId
}

const key = (inventory: Pick<Inventory, 'itemCode' | 'warehouseCode'>): string =>
  `${inventory.itemCode}:${inventory.warehouseCode}`

export function recordMovements(
  before: readonly Inventory[],
  after: readonly Inventory[],
  ctx: MovementContext,
): StockMovement[] {
  const previous = new Map(before.map((inventory) => [key(inventory), inventory]))

  const movements: StockMovement[] = []

  for (const inventory of after) {
    const old = previous.get(key(inventory))

    const currentDelta = inventory.currentQuantity - (old?.currentQuantity ?? 0)
    const reservedDelta = inventory.reservedQuantity - (old?.reservedQuantity ?? 0)

    // 움직이지 않은 칸은 이력이 아니다 — 한 요청이 건드린 품목만 남긴다
    if (currentDelta === 0 && reservedDelta === 0) continue

    movements.push({
      movementId: `${ctx.requestId}:${key(inventory)}`,
      kind: ctx.kind,

      itemCode: inventory.itemCode,
      warehouseCode: inventory.warehouseCode,

      currentDelta,
      reservedDelta,

      currentQuantity: inventory.currentQuantity,
      reservedQuantity: inventory.reservedQuantity,

      ...(ctx.orderId ? { orderId: ctx.orderId } : {}),
      ...(ctx.documentId ? { documentId: ctx.documentId } : {}),

      occurredAt: ctx.occurredAt,
    })
  }

  return movements
}
