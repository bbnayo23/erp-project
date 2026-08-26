// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { PreparationStatus } from '@/types'
import { AppProviders } from '@/app/providers'
import { OrderDetailPage } from '@/pages/OrderDetailPage'
import { useErpStore } from '@/store/erpStore'
import { planPreparation } from '@/domain/preparation/planPreparation'
import { findInventory } from '@/domain/inventory/getAvailableQuantity'

/**
 * 주문 상세의 렌더와 액션 (가이드 §29, §31 Step 7~9).
 *
 * 스토어 테스트가 액션의 결과를 지키고, 이 테스트는 담당자가 그 액션에 닿을 수 있는지를
 * 본다 — 상태에 맞는 버튼만 보이는가, 누른 결과가 화면에 반영되는가.
 */
describe('OrderDetailPage', () => {
  const state = () => useErpStore.getState()

  const renderDetail = (orderId: string) =>
    render(
      <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
        <Routes>
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>,
      { wrapper: AppProviders },
    )

  /** 시드에서 그 상태인 주문 하나를 찾는다 */
  const orderWith = (status: PreparationStatus) => {
    const entry = planPreparation(state()).entries.find(
      (candidate) => candidate.preparation.status === status,
    )
    if (!entry) throw new Error(`시드에 ${status} 주문이 없다`)
    return entry
  }

  const section = (title: string) => {
    const heading = screen.getByRole('heading', { name: title })
    // Panel 안에서 제목 다음에 오는 표
    const panel = heading.closest('section')
    if (!panel) throw new Error(`${title} 패널을 찾을 수 없다`)
    return panel
  }

  beforeEach(() => {
    state().reset()
  })

  afterEach(() => {
    cleanup()
  })

  describe('품목 표', () => {
    it('네 숫자를 나란히 보여준다', () => {
      const { order } = orderWith('SHORTAGE')
      renderDetail(order.orderId)

      const items = section('준비 품목')

      for (const header of ['상품', '필요', '가용재고', '입고예정', '부족']) {
        expect(within(items).getByRole('columnheader', { name: header })).toBeInTheDocument()
      }
    })

    it('품목별 숫자가 판정 결과와 같다', () => {
      const { order, preparation } = orderWith('SHORTAGE')
      renderDetail(order.orderId)

      const line = preparation.items.find((item) => item.shortageQuantity > 0)
      if (!line) throw new Error('부족 품목이 없다')

      const row = within(section('준비 품목')).getByRole('row', {
        name: new RegExp(line.itemCode),
      })
      const cells = within(row).getAllByRole('cell')

      expect(cells[1]).toHaveTextContent(String(line.requiredQuantity))
      expect(cells[2]).toHaveTextContent(String(line.availableQuantity))
      expect(cells[3]).toHaveTextContent(String(line.incomingQuantity))
      expect(cells[4]).toHaveTextContent(String(line.shortageQuantity))
    })

    it('부족수량 계산식을 밝힌다', () => {
      renderDetail(orderWith('SHORTAGE').order.orderId)

      expect(screen.getByText(/부족 = 필요 − 가용재고 − 입고예정/)).toBeInTheDocument()
    })
  })

  /** 상태에 따라 가능한 액션만 노출한다 */
  describe('액션 노출', () => {
    it('READY 주문에는 예약만 보인다', () => {
      renderDetail(orderWith('READY').order.orderId)

      expect(screen.getByRole('button', { name: '예약' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '출고' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '예약 해제' })).not.toBeInTheDocument()
    })

    it('SHORTAGE 주문에는 발주만 보인다', () => {
      renderDetail(orderWith('SHORTAGE').order.orderId)

      expect(screen.queryByRole('button', { name: '예약' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /부족분 발주 생성/ })).toBeInTheDocument()
    })

    it('WAITING 주문에는 예약도 발주도 없다', () => {
      renderDetail(orderWith('WAITING').order.orderId)

      expect(screen.queryByRole('button', { name: '예약' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /부족분 발주 생성/ })).not.toBeInTheDocument()
    })

    it('EXCEPTION 주문에는 사유만 있고 액션이 없다', () => {
      const { order, preparation } = orderWith('EXCEPTION')
      renderDetail(order.orderId)

      expect(screen.getByRole('heading', { name: '확인 필요' })).toBeInTheDocument()
      expect(screen.getByText(preparation.blockingReasons[0]?.message ?? '')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '예약' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /부족분 발주 생성/ })).not.toBeInTheDocument()
    })

    it('없는 주문이면 이유를 알려준다', () => {
      renderDetail('ORD-존재하지-않음')

      expect(screen.getByText('주문을 찾을 수 없습니다')).toBeInTheDocument()
    })
  })

  describe('예약과 출고', () => {
    it('예약하면 개체 배정 내역이 나오고 버튼이 출고로 바뀐다', () => {
      renderDetail(orderWith('READY').order.orderId)

      fireEvent.click(screen.getByRole('button', { name: '예약' }))

      expect(screen.getByText(/예약했습니다/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '출고' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '예약 해제' })).toBeInTheDocument()
      // 예약 버튼이 사라지므로 두 번 누를 수 없다
      expect(screen.queryByRole('button', { name: '예약' })).not.toBeInTheDocument()
    })

    it('시리얼 관리 품목이면 배정된 개체가 표에 나온다', () => {
      const entry = planPreparation(state()).entries.find((candidate) => {
        if (candidate.preparation.status !== 'READY') return false
        return candidate.preparation.items.some((item) => {
          const master = state().items.find((candidate2) => candidate2.itemCode === item.itemCode)
          return master?.serialManaged === true
        })
      })
      if (!entry) throw new Error('시드에 시리얼 품목 READY 주문이 없다')

      renderDetail(entry.order.orderId)
      fireEvent.click(screen.getByRole('button', { name: '예약' }))

      const serials = section('배정된 개체')
      const assigned = state().serials.filter(
        (serial) => serial.reservedOrderId === entry.order.orderId,
      )

      expect(assigned.length).toBeGreaterThan(0)
      for (const serial of assigned) {
        expect(within(serials).getByText(serial.serialNumber)).toBeInTheDocument()
      }
    })

    it('예약을 해제하면 다시 예약할 수 있다', () => {
      renderDetail(orderWith('READY').order.orderId)

      fireEvent.click(screen.getByRole('button', { name: '예약' }))
      fireEvent.click(screen.getByRole('button', { name: '예약 해제' }))

      expect(screen.getByText(/예약을 해제했습니다/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '예약' })).toBeInTheDocument()
    })

    it('출고하면 현재고가 줄고 준비 대상에서 빠진다', () => {
      const { order, preparation } = orderWith('READY')
      const line = preparation.items[0]
      if (!line) throw new Error('준비 품목이 없다')

      const before = findInventory(state().inventories, line.itemCode, order.warehouseCode)

      renderDetail(order.orderId)
      fireEvent.click(screen.getByRole('button', { name: '예약' }))
      fireEvent.click(screen.getByRole('button', { name: '출고' }))

      const after = findInventory(state().inventories, line.itemCode, order.warehouseCode)

      expect(after?.currentQuantity).toBe((before?.currentQuantity ?? 0) - line.requiredQuantity)
      expect(state().shipments).toHaveLength(1)
      // 출고 완료 주문은 준비 대상이 아니므로 상세가 '찾을 수 없음' 으로 바뀐다
      expect(screen.getByText('주문을 찾을 수 없습니다')).toBeInTheDocument()
    })
  })

  describe('발주와 입고', () => {
    it('발주하면 문서가 생기고 현재고는 그대로다', () => {
      const { order } = orderWith('SHORTAGE')
      const beforeDocuments = state().incomingDocuments.length
      const beforeQuantities = state().inventories.map((inventory) => inventory.currentQuantity)

      renderDetail(order.orderId)
      fireEvent.click(screen.getByRole('button', { name: /부족분 발주 생성/ }))

      expect(screen.getByText(/발주를 생성했습니다/)).toBeInTheDocument()
      expect(state().incomingDocuments.length).toBeGreaterThan(beforeDocuments)
      expect(state().inventories.map((inventory) => inventory.currentQuantity)).toEqual(
        beforeQuantities,
      )
    })

    it('발주 뒤에는 입고예정 표에 그 문서가 보인다', () => {
      const { order } = orderWith('SHORTAGE')

      renderDetail(order.orderId)
      fireEvent.click(screen.getByRole('button', { name: /부족분 발주 생성/ }))

      const created = state().incomingDocuments.filter(
        (document) => document.relatedOrderId === order.orderId,
      )
      const incoming = section('입고예정')

      expect(created.length).toBeGreaterThan(0)
      for (const document of created) {
        expect(within(incoming).getByText(document.documentId)).toBeInTheDocument()
      }
    })

    it('입고하면 현재고가 늘고 주문이 다시 판정된다', () => {
      const { order } = orderWith('SHORTAGE')

      renderDetail(order.orderId)
      fireEvent.click(screen.getByRole('button', { name: /부족분 발주 생성/ }))

      // 검사가 필요한 생산의뢰는 먼저 통과시킨다
      for (const button of screen.queryAllByRole('button', { name: '검사 통과' })) {
        fireEvent.click(button)
      }

      const receiveButtons = screen.getAllByRole('button', { name: '입고' })
      const beforeShortage = state().inventories.reduce(
        (acc, inventory) => acc + inventory.currentQuantity,
        0,
      )

      for (const button of receiveButtons) {
        fireEvent.click(button)
      }

      const afterShortage = state().inventories.reduce(
        (acc, inventory) => acc + inventory.currentQuantity,
        0,
      )

      expect(afterShortage).toBeGreaterThan(beforeShortage)
      expect(screen.getByText(/입고했습니다/)).toBeInTheDocument()
    })

    /** 입고 수량 입력은 잔여 전량으로 채워진다 — 부분 입고가 예외다 */
    it('입고 수량은 잔여수량으로 기본 채워진다', () => {
      const { order } = orderWith('SHORTAGE')

      renderDetail(order.orderId)
      fireEvent.click(screen.getByRole('button', { name: /부족분 발주 생성/ }))
      for (const button of screen.queryAllByRole('button', { name: '검사 통과' })) {
        fireEvent.click(button)
      }

      const created = state().incomingDocuments.find(
        (document) => document.relatedOrderId === order.orderId && document.confirmed,
      )
      if (!created) throw new Error('발주 문서가 없다')

      const input = screen.getByLabelText(`${created.documentId} 입고 수량`)

      expect(input).toHaveValue(String(created.plannedQuantity - created.receivedQuantity))
    })

    it('잔여를 넘겨 입고하면 거부하고 이유를 알려준다', () => {
      const { order } = orderWith('SHORTAGE')

      renderDetail(order.orderId)
      fireEvent.click(screen.getByRole('button', { name: /부족분 발주 생성/ }))
      for (const button of screen.queryAllByRole('button', { name: '검사 통과' })) {
        fireEvent.click(button)
      }

      const created = state().incomingDocuments.find(
        (document) => document.relatedOrderId === order.orderId && document.confirmed,
      )
      if (!created) throw new Error('발주 문서가 없다')

      fireEvent.change(screen.getByLabelText(`${created.documentId} 입고 수량`), {
        target: { value: String(created.plannedQuantity + 1) },
      })
      fireEvent.click(screen.getAllByRole('button', { name: '입고' })[0] as HTMLElement)

      expect(screen.getByText(/잔여수량을 넘는 입고입니다/)).toBeInTheDocument()
    })
  })

  /**
   * 배송일을 맞추지 못하는 발주도 표에 남긴다. 담당자가 알아야 하는 것은 '발주가 없다' 가
   * 아니라 '있지만 늦게 온다' 다.
   */
  it('배송일 이후 도착 예정 물량은 그렇게 표시한다', () => {
    const entry = planPreparation(state()).entries.find((candidate) =>
      state().incomingDocuments.some(
        (document) =>
          document.warehouseCode === candidate.order.warehouseCode &&
          document.confirmed &&
          document.plannedQuantity > document.receivedQuantity &&
          document.availableDate >= candidate.order.deliveryDate &&
          candidate.preparation.items.some((item) => item.itemCode === document.itemCode),
      ),
    )
    if (!entry) return // 시드에 그런 조합이 없으면 확인할 것이 없다

    renderDetail(entry.order.orderId)

    expect(within(section('입고예정')).getAllByText('배송일 이후 도착').length).toBeGreaterThan(0)
  })
})
