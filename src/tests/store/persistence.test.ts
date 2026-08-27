// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import type { ErpDatabase } from '@/types'
import { useErpStore } from '@/store/erpStore'
import { planPreparation } from '@/domain/preparation/planPreparation'

/**
 * 처리 결과가 새로고침 뒤에도 남는가 (과제 §6).
 *
 * 이 프로젝트에는 백엔드가 없다. 담당자가 예약·출고·입고를 처리하고 화면을 새로 열었을
 * 때 시드 상태로 돌아가 있으면 아무것도 처리하지 않은 것과 같으므로, 앱이 바꾸는
 * 컬렉션만 localStorage 에 저장한다.
 *
 * 저장된 JSON 을 직접 읽어 검증한다. 새 세션의 복원은 모듈이 한 번만 초기화되는 구조라
 * 테스트에서 재현할 수 없고, 재현하더라도 확인할 것은 결국 '저장분에 그 변화가 들어
 * 있는가' 다.
 */
describe('상태 저장', () => {
  const state = () => useErpStore.getState()
  const STORAGE_KEY = 'erp-project/state'

  /** localStorage 에 저장된 슬라이스 */
  const saved = (): Partial<ErpDatabase> => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) throw new Error('저장된 상태가 없다')
    return (JSON.parse(raw) as { state: Partial<ErpDatabase> }).state
  }

  const readyOrderId = () => {
    const entry = planPreparation(state()).entries.find(
      (candidate) => candidate.preparation.status === 'READY' && !candidate.reserved,
    )
    if (!entry) throw new Error('시드에 바로 준비 가능한 주문이 없다')
    return entry.order.orderId
  }

  beforeEach(() => {
    state().reset()
  })

  it('예약하면 예약 기록과 재고가 저장된다', () => {
    const orderId = readyOrderId()

    expect(state().reserve(orderId).ok).toBe(true)

    const stored = saved()
    expect(stored.reservations?.some((reservation) => reservation.orderId === orderId)).toBe(true)
    expect(stored.inventories).toEqual(state().inventories)
    expect(stored.stockMovements).toEqual(state().stockMovements)
  })

  it('반복 요청을 막는 근거도 함께 저장된다', () => {
    const orderId = readyOrderId()
    state().reserve(orderId)

    // 처리 이력이 저장되지 않으면 새로고침 뒤 같은 요청이 다시 통과한다
    expect(saved().processedRequests?.some((request) => request.requestId.includes(orderId))).toBe(
      true,
    )
  })

  /**
   * 01_품목 · 03_창고 · 08_공급처는 앱이 바꾸지 않는다. 저장해 두면 시드를 고쳐도 옛
   * 사본이 살아남아 화면과 엑셀이 어긋난다.
   */
  it('앱이 바꾸지 않는 기준정보는 저장하지 않는다', () => {
    state().reserve(readyOrderId())

    const stored = saved()
    expect(stored.items).toBeUndefined()
    expect(stored.warehouses).toBeUndefined()
    expect(stored.suppliers).toBeUndefined()
    expect(stored.bundleComponents).toBeUndefined()
  })

  it('초기화하면 저장분도 시드 상태로 덮인다', () => {
    state().reserve(readyOrderId())
    expect(saved().reservations).not.toEqual([])

    state().reset()

    // 저장분을 그대로 두면 새로고침 때 지운 상태가 되살아난다
    expect(saved().reservations).toEqual([])
    expect(saved().stockMovements).toEqual([])
    expect(state().reservations).toEqual([])
  })
})
