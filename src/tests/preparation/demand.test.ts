import { describe, expect, it } from 'vitest'
import { evaluateOrder } from '@/domain/preparation/evaluateOrder'
import { calculateOrderDemand } from '@/domain/order/calculateDemand'
import { db, inventory, lineOf, order } from '../fixtures'

/**
 * Case 1. 세트상품 전개 (가이드 §5.2, §28)
 *
 * 세트상품 자체는 재고·발주 대상이 아니다. 구성품으로 풀어야 실제 준비 수요가 나온다.
 */
describe('세트상품 전개', () => {
  const stocked = [inventory('MAT-Q', 10), inventory('FRM-Q', 10), inventory('PIL-STD', 10)]

  it('세트 1개는 구성품 수량으로 풀린다', () => {
    const target = order({ id: 'ORD-001', items: [{ itemCode: 'SET-001', quantity: 1 }] })
    const preparation = evaluateOrder(db({ inventories: stocked }), target)

    expect(lineOf(preparation, 'MAT-Q').requiredQuantity).toBe(1)
    expect(lineOf(preparation, 'FRM-Q').requiredQuantity).toBe(1)
    expect(lineOf(preparation, 'PIL-STD').requiredQuantity).toBe(2)
  })

  it('세트 수량만큼 구성품 수량이 곱해진다', () => {
    const target = order({ id: 'ORD-002', items: [{ itemCode: 'SET-001', quantity: 3 }] })
    const preparation = evaluateOrder(db({ inventories: stocked }), target)

    expect(lineOf(preparation, 'MAT-Q').requiredQuantity).toBe(3)
    expect(lineOf(preparation, 'PIL-STD').requiredQuantity).toBe(6)
  })

  it('세트상품 자체는 준비 품목으로 남지 않는다', () => {
    const target = order({ id: 'ORD-003', items: [{ itemCode: 'SET-001', quantity: 1 }] })
    const preparation = evaluateOrder(db({ inventories: stocked }), target)

    expect(preparation.items.map((item) => item.itemCode)).not.toContain('SET-001')
  })

  it('세트에 묶인 설치 서비스는 재고 수요에서 빠진다', () => {
    const target = order({ id: 'ORD-004', items: [{ itemCode: 'SET-001', quantity: 1 }] })
    const preparation = evaluateOrder(db({ inventories: stocked }), target)

    expect(preparation.items.map((item) => item.itemCode)).not.toContain('SVC-INSTALL')
    expect(preparation.excludedItemCodes).toContain('SVC-INSTALL')
  })

  it('주문행으로 직접 들어온 서비스도 제외된다', () => {
    const target = order({
      id: 'ORD-005',
      items: [
        { itemCode: 'PIL-STD', quantity: 1 },
        { itemCode: 'SVC-INSTALL', quantity: 1 },
      ],
    })
    const preparation = evaluateOrder(db({ inventories: stocked }), target)

    expect(preparation.items).toHaveLength(1)
    expect(preparation.excludedItemCodes).toContain('SVC-INSTALL')
  })

  /**
   * 같은 품목이 일반 주문행과 세트 구성품에 동시에 있으면 합산해야 한다 (§5.2).
   * 따로 세면 베개 2개는 예약되고 3개는 잊힌다.
   */
  it('일반 주문행과 세트 구성품의 같은 품목은 합산된다', () => {
    const target = order({
      id: 'ORD-006',
      items: [
        { itemCode: 'SET-001', quantity: 1 },
        { itemCode: 'PIL-STD', quantity: 3 },
      ],
    })
    const preparation = evaluateOrder(db({ inventories: stocked }), target)

    expect(preparation.items.filter((item) => item.itemCode === 'PIL-STD')).toHaveLength(1)
    expect(lineOf(preparation, 'PIL-STD').requiredQuantity).toBe(5)
  })

  it('세트 안의 세트도 끝까지 풀린다', () => {
    const nested = db({
      bundleComponents: [
        {
          bundleItemCode: 'SET-002',
          componentItemCode: 'SET-001',
          quantity: 2,
          isOutboundTarget: true,
        },
        {
          bundleItemCode: 'SET-001',
          componentItemCode: 'PIL-STD',
          quantity: 2,
          isOutboundTarget: true,
        },
      ],
      items: [
        ...db().items,
        {
          itemCode: 'SET-002',
          itemName: '2인 세트',
          category: '결합제품' as const,
          itemType: '세트상품' as const,
          serialManaged: false,
        },
      ],
      inventories: stocked,
    })

    const demand = calculateOrderDemand(
      nested,
      order({ id: 'ORD-007', items: [{ itemCode: 'SET-002', quantity: 1 }] }),
    )

    expect(demand.lines).toEqual([{ itemCode: 'PIL-STD', quantity: 4 }])
  })
})
