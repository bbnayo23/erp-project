import type { ErpDatabase, StockMovement } from '@/types'
import { MOVEMENT_KIND } from '@/features/inventory/utils'
import { findItem } from '@/domain/master/itemRules'
import type { DataFreshness, RecentChange } from './types'

/**
 * 화면이 보여주는 숫자의 출처를 한 줄로 요약한다.
 *
 * 재고 변동 이력(`stockMovements`)이 곧 '내가 처리한 것' 의 목록이다. 시드에는 이력이
 * 없으므로(앱이 만드는 컬렉션) 길이가 그대로 처리 횟수가 된다.
 */
export function toFreshness(
  ctx: Pick<ErpDatabase, 'stockMovements' | 'items' | 'baseAt'>,
): DataFreshness {
  const last = ctx.stockMovements.at(-1)

  return {
    baseAt: ctx.baseAt,
    changeCount: ctx.stockMovements.length,
    ...(last ? { lastChange: describe(last, ctx.items) } : {}),
  }
}

const describe = (movement: StockMovement, items: ErpDatabase['items']) => {
  const itemName = findItem(items, movement.itemCode)?.itemName ?? movement.itemCode
  const reference = movement.orderId ?? movement.documentId ?? ''

  return {
    label: MOVEMENT_KIND[movement.kind].label,
    detail: reference ? `${itemName} · ${reference}` : itemName,
  }
}

/**
 * 방금 처리가 건드린 자리.
 *
 * 마지막 요청이 만든 이력만 본다. 이력 ID 는 `요청ID:품목:창고` 라 앞부분이 같은 것이
 * 한 번의 처리다 — 한 주문을 예약하면 품목 수만큼 이력이 생기는데, 그 전부가 방금
 * 바뀐 자리다.
 *
 * 이전 처리까지 표시하지 않는 이유: '방금' 이 두 번이면 어느 쪽이 방금인지 알 수 없다.
 */
export function toRecentChanges(
  ctx: Pick<ErpDatabase, 'stockMovements' | 'items'>,
): RecentChange[] {
  const last = ctx.stockMovements.at(-1)
  if (!last) return []

  const requestId = last.movementId.slice(0, last.movementId.indexOf(`:${last.itemCode}:`))

  return ctx.stockMovements
    .filter((movement) => movement.movementId.startsWith(`${requestId}:`))
    .map((movement) => ({
      key: `${movement.itemCode}@${movement.warehouseCode}`,
      label: MOVEMENT_KIND[movement.kind].label,
    }))
}
