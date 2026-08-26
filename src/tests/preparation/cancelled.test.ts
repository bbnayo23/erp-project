import { describe, expect, it } from 'vitest'
import { evaluateOrder } from '@/domain/preparation/evaluateOrder'
import { planPreparation } from '@/domain/preparation/planPreparation'
import { blockCodes, db, entryOf, inventory, order } from '../fixtures'

/**
 * Case 2. 취소 데이터 (가이드 §4.2, §5.1, §28)
 *
 * 취소는 두 층에 있다 — 주문 전체가 취소되는 경우와, 주문은 살아 있고 품목만 빠지는 경우.
 * 둘을 같이 처리하면 살아 있는 품목까지 날리거나 죽은 품목까지 예약한다.
 */
describe('취소 데이터', () => {
  it('취소 품목은 수요에서 빠지고 정상 품목만 남는다', () => {
    const target = order({
      id: 'ORD-001',
      items: [
        { itemCode: 'PIL-STD', quantity: 2 },
        { itemCode: 'MAT-Q', quantity: 1, status: '취소' },
      ],
    })

    const preparation = evaluateOrder(db({ inventories: [inventory('PIL-STD', 10)] }), target)

    expect(preparation.items.map((item) => item.itemCode)).toEqual(['PIL-STD'])
    expect(preparation.status).toBe('READY')
  })

  it('정상 품목이 하나도 없으면 준비할 것이 없다', () => {
    const target = order({
      id: 'ORD-002',
      items: [{ itemCode: 'PIL-STD', quantity: 2, status: '취소' }],
    })

    const preparation = evaluateOrder(db({ inventories: [inventory('PIL-STD', 10)] }), target)

    expect(preparation.status).toBe('EXCEPTION')
    expect(blockCodes(preparation)).toContain('NO_DEMAND')
  })

  it.each(['취소', '출고 완료', '배송 완료'] as const)(
    "주문상태가 '%s' 면 준비 대상이 아니다",
    (status) => {
      const target = order({
        id: 'ORD-003',
        status,
        items: [{ itemCode: 'PIL-STD', quantity: 1 }],
      })

      const preparation = evaluateOrder(db({ inventories: [inventory('PIL-STD', 10)] }), target)

      expect(preparation.status).toBe('EXCEPTION')
      expect(blockCodes(preparation)).toEqual(['ORDER_NOT_CONFIRMED'])
      expect(preparation.items).toHaveLength(0)
    },
  )

  it('준비 대상이 아닌 주문은 계획에 아예 오르지 않는다', () => {
    const plan = planPreparation(
      db({
        inventories: [inventory('PIL-STD', 10)],
        orders: [
          order({ id: 'ORD-CONFIRMED', items: [{ itemCode: 'PIL-STD', quantity: 1 }] }),
          order({
            id: 'ORD-CANCELLED',
            status: '취소',
            items: [{ itemCode: 'PIL-STD', quantity: 1 }],
          }),
          order({
            id: 'ORD-SHIPPED',
            status: '출고 완료',
            items: [{ itemCode: 'PIL-STD', quantity: 1 }],
          }),
        ],
      }),
    )

    expect(plan.entries.map((entry) => entry.order.orderId)).toEqual(['ORD-CONFIRMED'])
  })

  /**
   * 취소 주문이 재고를 붙들고 있으면 살아 있는 주문이 못 나간다.
   * 배송일이 더 빠르다는 이유로 취소 주문에 우선권이 가면 안 된다.
   */
  it('취소 주문은 배송일이 빨라도 재고를 잡지 않는다', () => {
    const plan = planPreparation(
      db({
        inventories: [inventory('PIL-STD', 1)],
        orders: [
          order({
            id: 'ORD-CANCELLED',
            status: '취소',
            deliveryDay: 22,
            items: [{ itemCode: 'PIL-STD', quantity: 1 }],
          }),
          order({
            id: 'ORD-ALIVE',
            deliveryDay: 25,
            items: [{ itemCode: 'PIL-STD', quantity: 1 }],
          }),
        ],
      }),
    )

    expect(entryOf(plan, 'ORD-ALIVE').preparation.status).toBe('READY')
  })
})
