import { useMemo } from 'react'
import { planPreparation, type PreparationPlan } from '@/domain/preparation/planPreparation'
import { toFreshness, toRecentChanges, type DataFreshness } from '@/features/audit'
import { useErpStore } from './erpStore'

/**
 * 준비 계획. 목록·상세 화면이 모두 이것을 본다.
 *
 * 셀렉터 안에서 planPreparation 을 부르면 안 된다. 매 렌더마다 새 객체가 나와
 * zustand 가 상태가 바뀐 것으로 보고 무한히 다시 그린다. 그래서 계획에 필요한
 * 컬렉션만 각각 고른 뒤(참조가 안정적이다) useMemo 로 묶는다.
 *
 * 계획은 스토어에 저장하지 않는다. 재고가 바뀌면 반드시 다시 계산되어야 하는데,
 * 저장하면 갱신을 잊은 화면이 낡은 판정을 보여줄 수 있다 — 가용재고를 필드로 두지
 * 않는 것과 같은 이유다.
 */
export function usePreparationPlan(): PreparationPlan {
  const items = useErpStore((state) => state.items)
  const bundleComponents = useErpStore((state) => state.bundleComponents)
  const warehouses = useErpStore((state) => state.warehouses)
  const inventories = useErpStore((state) => state.inventories)
  const incomingDocuments = useErpStore((state) => state.incomingDocuments)
  const orders = useErpStore((state) => state.orders)
  const reservations = useErpStore((state) => state.reservations)

  return useMemo(
    () =>
      planPreparation({
        items,
        bundleComponents,
        warehouses,
        inventories,
        incomingDocuments,
        orders,
        reservations,
      }),
    [items, bundleComponents, warehouses, inventories, incomingDocuments, orders, reservations],
  )
}

/**
 * 화면이 보여주는 숫자의 출처.
 *
 * 세 화면 머리말이 같은 줄을 쓴다 — 화면마다 다른 자리에 있으면 담당자가 매번 찾는다.
 */
export function useFreshness(): DataFreshness {
  const stockMovements = useErpStore((state) => state.stockMovements)
  const items = useErpStore((state) => state.items)
  const baseAt = useErpStore((state) => state.baseAt)

  return useMemo(
    () => toFreshness({ stockMovements, items, baseAt }),
    [stockMovements, items, baseAt],
  )
}

/**
 * 방금 처리가 건드린 품목@창고.
 *
 * 표에서 그 행을 잠시 표시해, 담당자가 자기 조작이 의도한 자리에 반영됐는지 눈으로
 * 확인할 수 있게 한다.
 */
export function useRecentChanges(): Map<string, string> {
  const stockMovements = useErpStore((state) => state.stockMovements)
  const items = useErpStore((state) => state.items)

  return useMemo(
    () => new Map(toRecentChanges({ stockMovements, items }).map((c) => [c.key, c.label])),
    [stockMovements, items],
  )
}
