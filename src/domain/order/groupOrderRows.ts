import type { Order, OrderItem, OrderRow } from '@/types'

/**
 * 06_주문 행을 주문 단위로 접는다.
 *
 * 시트는 주문 하나를 품목별 여러 행으로 갖고 있다. 화면과 도메인 로직은 주문 단위로
 * 판단하므로(한 주문은 모든 품목을 준비할 수 있을 때만 예약한다) 여기서 한 번 변환하고
 * 이후로는 Order 만 쓴다.
 *
 * 주문 머리 정보(주문상태·창고·일자)는 순번이 가장 앞선 행에서 가져온다.
 * '취소' 품목도 items 에 남긴다 — 준비 대상에서는 빠지지만 목록에는 보여야 한다.
 */
export const groupOrderRows = (rows: readonly OrderRow[]): Order[] => {
  const grouped = new Map<string, OrderRow[]>()

  for (const row of rows) {
    const bucket = grouped.get(row.orderId)
    if (bucket) bucket.push(row)
    else grouped.set(row.orderId, [row])
  }

  return [...grouped].map(([orderId, orderRows]) => {
    const sorted = [...orderRows].sort((a, b) => a.itemSequence - b.itemSequence)
    // grouped 의 키가 존재한다는 것은 행이 최소 한 개 있다는 뜻이다
    const head = sorted[0] as OrderRow

    const items: OrderItem[] = sorted.map((row) => ({
      sequence: row.itemSequence,
      itemCode: row.itemCode,
      quantity: row.quantity,
      status: row.itemStatus,
    }))

    return {
      orderId,
      status: head.orderStatus,
      orderedAt: head.orderedAt,
      deliveryDate: head.deliveryDate,
      warehouseCode: head.warehouseCode,
      items,
      updatedAt: head.updatedAt,
    }
  })
}
