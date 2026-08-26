import { describe, expect, it } from 'vitest'
import { evaluateOrder } from '@/domain/preparation/evaluateOrder'
import { planPreparation } from '@/domain/preparation/planPreparation'
import { blockCodes, db, entryOf, inventory, order } from '../fixtures'

/**
 * Case 5. 예외 데이터 (가이드 §19, §28)
 *
 * 자동 처리하지 않는다는 것이 규칙이다 — 재고를 바꾸지 않고, 발주를 만들지 않고,
 * 다른 품목이나 다른 창고로 대체하지 않는다. 담당자가 읽을 사유만 남긴다.
 */
describe('예외 데이터', () => {
  const stocked = db({ inventories: [inventory('PIL-STD', 10)] })

  it('미등록 품목은 EXCEPTION 이고 사유에 품목코드가 담긴다', () => {
    const preparation = evaluateOrder(
      stocked,
      order({ id: 'ORD-001', items: [{ itemCode: 'UNKNOWN-SKU', quantity: 1 }] }),
    )

    expect(preparation.status).toBe('EXCEPTION')
    expect(blockCodes(preparation)).toContain('UNKNOWN_ITEM')
    expect(preparation.blockingReasons[0]?.message).toContain('UNKNOWN-SKU')
    expect(preparation.blockingReasons[0]?.itemCode).toBe('UNKNOWN-SKU')
  })

  it('사용 중지된 출고창고는 품목 명세를 내지 않는다', () => {
    const preparation = evaluateOrder(
      db({ inventories: [inventory('PIL-STD', 5, 0, 'WH-LEGACY')] }),
      order({
        id: 'ORD-002',
        warehouseCode: 'WH-LEGACY',
        items: [{ itemCode: 'PIL-STD', quantity: 1 }],
      }),
    )

    expect(preparation.status).toBe('EXCEPTION')
    expect(blockCodes(preparation)).toEqual(['INACTIVE_WAREHOUSE'])
    // 'WH-LEGACY 에 5개 있음' 을 같이 띄우면 낼 수 있다는 오해를 부른다
    expect(preparation.items).toHaveLength(0)
  })

  it('등록되지 않은 창고도 EXCEPTION 이다', () => {
    const preparation = evaluateOrder(
      stocked,
      order({
        id: 'ORD-003',
        warehouseCode: 'WH-NOPE',
        items: [{ itemCode: 'PIL-STD', quantity: 1 }],
      }),
    )

    expect(blockCodes(preparation)).toEqual(['UNKNOWN_WAREHOUSE'])
  })

  it.each([0, -3])('수량이 %i 이면 EXCEPTION 이다', (quantity) => {
    const preparation = evaluateOrder(
      stocked,
      order({ id: 'ORD-004', items: [{ itemCode: 'PIL-STD', quantity }] }),
    )

    expect(preparation.status).toBe('EXCEPTION')
    expect(blockCodes(preparation)).toContain('INVALID_QUANTITY')
  })

  /**
   * 세트 구성 오류는 조용히 사라지는 쪽이 위험하다. 구성품이 없으면 소요량이 0 이 되어
   * 준비할 것이 없는 주문 = 준비 완료된 주문처럼 보인다.
   */
  it('구성품이 없는 세트는 EXCEPTION 이다', () => {
    const preparation = evaluateOrder(
      stocked,
      order({ id: 'ORD-005', items: [{ itemCode: 'SET-EMPTY', quantity: 1 }] }),
    )

    expect(preparation.status).toBe('EXCEPTION')
    expect(blockCodes(preparation)).toContain('BUNDLE_EMPTY')
  })

  it('자기 자신을 품는 세트는 EXCEPTION 이다', () => {
    const preparation = evaluateOrder(
      stocked,
      order({ id: 'ORD-006', items: [{ itemCode: 'SET-CYCLE', quantity: 1 }] }),
    )

    expect(preparation.status).toBe('EXCEPTION')
    expect(blockCodes(preparation)).toContain('BUNDLE_CYCLE')
  })

  it('정상 품목이 섞여 있어도 주문 전체가 EXCEPTION 이다', () => {
    const preparation = evaluateOrder(
      stocked,
      order({
        id: 'ORD-007',
        items: [
          { itemCode: 'PIL-STD', quantity: 1 },
          { itemCode: 'UNKNOWN-SKU', quantity: 1 },
        ],
      }),
    )

    expect(preparation.status).toBe('EXCEPTION')
  })

  /**
   * 데이터를 고친 뒤 다시 판정할 때 이미 자기 몫을 잡아버린 상태면 부족분이 실제보다
   * 작게 나온다. EXCEPTION 주문은 재고를 한 개도 잡지 않아야 한다.
   */
  it('EXCEPTION 주문은 배송일이 빨라도 재고를 잡지 않는다', () => {
    const plan = planPreparation(
      db({
        inventories: [inventory('PIL-STD', 1)],
        orders: [
          order({
            id: 'ORD-BAD',
            deliveryDay: 22,
            items: [
              { itemCode: 'PIL-STD', quantity: 1 },
              { itemCode: 'UNKNOWN-SKU', quantity: 1 },
            ],
          }),
          order({ id: 'ORD-GOOD', deliveryDay: 26, items: [{ itemCode: 'PIL-STD', quantity: 1 }] }),
        ],
      }),
    )

    expect(entryOf(plan, 'ORD-BAD').preparation.status).toBe('EXCEPTION')
    expect(entryOf(plan, 'ORD-GOOD').preparation.status).toBe('READY')
  })
})
