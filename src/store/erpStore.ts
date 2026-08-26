import { create } from 'zustand'
import type { InventoryRecord, Item, Warehouse } from '@/features/inventory/types'
import type { Order } from '@/features/orders/types'
import type { PurchaseOrder, ReceiptLine } from '@/features/purchase/types'
import { reserveInventory } from '@/domain/inventory/reserveInventory'
import { releaseInventory } from '@/domain/inventory/releaseInventory'
import { shipInventory } from '@/domain/inventory/shipInventory'
import {
  calculateDemand,
  calculateOrderDemand,
  mergeDemand,
  subtractDemand,
} from '@/domain/order/calculateDemand'
import {
  canCancel,
  canConfirm,
  canShip,
  evaluateOrderStatus,
  toCumulativeAllocation,
} from '@/domain/order/evaluateOrderStatus'
import { calculateShortage } from '@/domain/purchase/calculateShortage'
import {
  createPurchaseOrder,
  groupShortagesBySupplier,
} from '@/domain/purchase/createPurchaseOrder'
import { receivePurchaseOrder } from '@/domain/purchase/receivePurchaseOrder'
import { inventoryRepository } from '@/data/repositories/inventoryRepository'
import { orderRepository } from '@/data/repositories/orderRepository'
import { purchaseRepository } from '@/data/repositories/purchaseRepository'
import { SEED_INVENTORY } from '@/data/seed/inventory'
import { SEED_ITEMS } from '@/data/seed/items'
import { SEED_ORDERS } from '@/data/seed/orders'
import { SEED_PURCHASE_ORDERS } from '@/data/seed/purchaseOrders'
import { SEED_WAREHOUSES } from '@/data/seed/warehouses'
import {
  createIdempotencyKey,
  emptyIdempotencyLog,
  hasProcessed,
  runOnce,
  type IdempotencyLog,
} from '@/utils/idempotency'
import { today } from '@/utils/date'

/** 액션 결과 — 화면은 이 값으로 배너를 띄운다 */
export interface ActionResult {
  ok: boolean
  message: string
}

const ok = (message: string): ActionResult => ({ ok: true, message })
const fail = (message: string): ActionResult => ({ ok: false, message })

export interface ErpData {
  items: Item[]
  warehouses: Warehouse[]
  inventory: InventoryRecord[]
  orders: Order[]
  purchaseOrders: PurchaseOrder[]
  idempotency: IdempotencyLog
}

interface ErpActions {
  /** 수주 확정 — 가용 재고 범위에서 예약하고 상태를 재평가한다 */
  confirmOrder: (orderId: string) => ActionResult
  /** 수주 취소 — 예약을 전부 풀어준다 */
  cancelOrder: (orderId: string) => ActionResult
  /** 출하 — 예약분을 실물 재고에서 덜어낸다 */
  shipOrder: (orderId: string) => ActionResult
  /** 부족분을 공급처별 발주로 만든다 */
  createPurchaseOrdersForShortage: (warehouseId: string) => ActionResult
  /** 입고 처리 */
  receivePurchase: (purchaseOrderId: string, receipts: ReceiptLine[]) => ActionResult
  /** 시드 상태로 되돌린다 (데모용) */
  reset: () => void
}

export type ErpStore = ErpData & ErpActions

/**
 * confirmOrder 의 순수 코어 — 부팅과 액션이 같은 경로를 쓴다.
 *
 * 이미 잡고 있는 예약(order.allocated)을 뺀 잔여 소요량만 예약한다.
 * 상태는 이번 회차가 아니라 누적 예약 기준으로 평가한다.
 */
function applyConfirm(data: ErpData, orderId: string): Pick<ErpData, 'inventory' | 'orders'> {
  const order = orderRepository.find(data.orders, orderId)
  if (!order) return { inventory: data.inventory, orders: data.orders }

  const demand = calculateOrderDemand(data.items, order)
  const held = order.allocated ?? []

  const { records, allocation } = reserveInventory({
    records: data.inventory,
    warehouseId: order.warehouseId,
    demand: subtractDemand(demand, held),
    updatedAt: today(),
  })

  const nextHeld = mergeDemand(
    held,
    allocation.lines.map((line) => ({ itemId: line.itemId, quantity: line.allocated })),
  )

  return {
    inventory: records,
    orders: orderRepository.replace(data.orders, {
      ...order,
      allocated: nextHeld,
      status: evaluateOrderStatus(order, toCumulativeAllocation(demand, nextHeld)),
    }),
  }
}

/**
 * 시드 상태를 만든다.
 *
 * CONFIRMED 로 시드된 수주는 여기서 실제 예약을 거친다. 예약 수량을 시드에 손으로
 * 적지 않기 때문에 재고와 수주가 항상 정합하고, 부팅 경로가 도메인 로직을 한 번 검증한다.
 */
function createInitialData(): ErpData {
  const base: ErpData = {
    items: SEED_ITEMS,
    warehouses: SEED_WAREHOUSES,
    inventory: SEED_INVENTORY,
    orders: SEED_ORDERS,
    purchaseOrders: SEED_PURCHASE_ORDERS,
    idempotency: emptyIdempotencyLog,
  }

  return SEED_ORDERS.filter((order) => order.status === 'CONFIRMED').reduce(
    (acc, order) => ({ ...acc, ...applyConfirm(acc, order.id) }),
    base,
  )
}

export const useErpStore = create<ErpStore>()((set, get) => ({
  ...createInitialData(),

  /**
   * 확정은 멱등성 키로 막지 않는다.
   *
   * order.allocated 를 뺀 잔여 소요량만 예약하므로 두 번 눌러도 이중 예약이 되지 않고,
   * 발주가 입고된 뒤 다시 눌러 부족분을 채우는 건 정당한 재시도다. 키로 막으면
   * 그 재시도까지 막힌다. 재고를 실제로 소비하는 취소·출하·입고는 여전히 키로 막는다.
   */
  confirmOrder: (orderId) => {
    const state = get()
    const order = orderRepository.find(state.orders, orderId)
    if (!order) return fail('수주를 찾을 수 없습니다.')
    if (!canConfirm(order)) return fail(`${order.code} 는 확정할 수 있는 상태가 아닙니다.`)

    set((current) => ({ ...current, ...applyConfirm(current, orderId) }))

    const updated = orderRepository.find(get().orders, orderId)
    if (updated?.status === 'ALLOCATED') return ok(`${order.code} 전량 재고를 예약했습니다.`)
    if (updated?.status === 'PARTIALLY_ALLOCATED') {
      return ok(`${order.code} 일부만 예약했습니다. 부족분은 발주 화면에서 확인하세요.`)
    }
    return ok(`${order.code} 예약할 가용 재고가 없습니다. 발주가 필요합니다.`)
  },

  cancelOrder: (orderId) => {
    const state = get()
    const order = orderRepository.find(state.orders, orderId)
    if (!order) return fail('수주를 찾을 수 없습니다.')
    if (!canCancel(order)) return fail(`${order.code} 는 취소할 수 없는 상태입니다.`)

    const key = createIdempotencyKey('cancelOrder', orderId)

    set((current) =>
      runOnce(current, key, (draft) => ({
        ...draft,
        // 이 수주가 잡고 있던 몫만 풀어준다 — 창고 합계로 풀면 남의 예약이 사라진다
        inventory: releaseInventory({
          records: draft.inventory,
          warehouseId: order.warehouseId,
          reserved: order.allocated ?? [],
          updatedAt: today(),
        }),
        orders: orderRepository.replace(draft.orders, {
          ...order,
          status: 'CANCELLED',
          allocated: [],
        }),
      })),
    )

    return ok(`${order.code} 를 취소하고 예약 재고를 해제했습니다.`)
  },

  shipOrder: (orderId) => {
    const state = get()
    const order = orderRepository.find(state.orders, orderId)
    if (!order) return fail('수주를 찾을 수 없습니다.')
    if (!canShip(order)) return fail(`${order.code} 는 전량 예약된 상태에서만 출하할 수 있습니다.`)

    // 예약한 만큼만 내보낸다 — 소요량으로 내보내면 예약을 넘어선 출고가 된다
    const shipment = order.allocated ?? []
    const preview = shipInventory({
      records: state.inventory,
      warehouseId: order.warehouseId,
      shipment,
      updatedAt: today(),
    })

    if (preview.violations.length > 0) {
      return fail(`${order.code} 예약 수량이 부족해 출하할 수 없습니다.`)
    }

    const key = createIdempotencyKey('shipOrder', orderId)

    set((current) =>
      runOnce(current, key, (draft) => ({
        ...draft,
        inventory: shipInventory({
          records: draft.inventory,
          warehouseId: order.warehouseId,
          shipment,
          updatedAt: today(),
        }).records,
        orders: orderRepository.replace(draft.orders, {
          ...order,
          status: 'SHIPPED',
          allocated: [],
        }),
      })),
    )

    return ok(`${order.code} 를 출하 처리했습니다.`)
  },

  createPurchaseOrdersForShortage: (warehouseId) => {
    const state = get()
    const demand = calculateDemand({ items: state.items, orders: state.orders, warehouseId })
    const shortages = calculateShortage({
      items: state.items,
      inventory: state.inventory,
      purchaseOrders: state.purchaseOrders,
      demand,
      warehouseId,
    })

    if (shortages.length === 0) return fail('발주할 부족분이 없습니다.')

    // 같은 부족분 스냅샷으로 두 번 누르면 발주가 두 배로 생긴다
    const key = createIdempotencyKey(
      'createPurchaseOrders',
      warehouseId,
      shortages.map((line) => `${line.itemId}=${line.shortage}`).join(','),
    )
    if (hasProcessed(state.idempotency, key)) {
      return fail('같은 부족분에 대한 발주가 이미 생성되었습니다.')
    }

    const groups = groupShortagesBySupplier(state.items, shortages)
    const identities = purchaseRepository.nextIdentities(state.purchaseOrders, groups.length)
    const orderedAt = today()

    const created = groups
      .map((group, index) => {
        const identity = identities[index]
        if (!identity) return null
        return createPurchaseOrder({
          id: identity.id,
          code: identity.code,
          supplier: group.supplier,
          warehouseId,
          orderedAt,
          items: state.items,
          shortages: group.shortages,
        })
      })
      .filter((purchaseOrder): purchaseOrder is PurchaseOrder => purchaseOrder !== null)

    if (created.length === 0) return fail('발주할 부족분이 없습니다.')

    set((current) =>
      runOnce(current, key, (draft) => ({
        ...draft,
        purchaseOrders: created.reduce(
          (acc, purchaseOrder) => purchaseRepository.add(acc, purchaseOrder),
          draft.purchaseOrders,
        ),
      })),
    )

    return ok(`부족분 ${shortages.length}건을 발주 ${created.length}건으로 생성했습니다.`)
  },

  receivePurchase: (purchaseOrderId, receipts) => {
    const state = get()
    const purchaseOrder = purchaseRepository.find(state.purchaseOrders, purchaseOrderId)
    if (!purchaseOrder) return fail('발주를 찾을 수 없습니다.')

    const applied = receipts.filter((receipt) => receipt.quantity > 0)
    if (applied.length === 0) return fail('입고 수량을 입력하세요.')

    const result = receivePurchaseOrder({ purchaseOrder, receipts: applied })
    if (result.violations.length > 0) return fail('발주 잔량을 초과한 입고 수량이 있습니다.')

    const key = createIdempotencyKey(
      'receivePurchase',
      purchaseOrderId,
      applied.map((receipt) => `${receipt.lineId}=${receipt.quantity}`).join(','),
    )
    if (hasProcessed(state.idempotency, key)) return fail('같은 입고가 이미 처리되었습니다.')

    set((current) =>
      runOnce(current, key, (draft) => ({
        ...draft,
        purchaseOrders: purchaseRepository.replace(draft.purchaseOrders, result.purchaseOrder),
        inventory: inventoryRepository.applyDeltas(draft.inventory, result.deltas, today()),
      })),
    )

    return ok(`${purchaseOrder.code} 입고를 반영했습니다.`)
  },

  reset: () => set(createInitialData()),
}))
