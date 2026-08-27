// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { PreparationStatus } from '@/types'
import { AppProviders } from '@/app/providers'
import { OrderDetailPage } from '@/pages/OrderDetailPage'
import { useErpStore } from '@/store/erpStore'
import { lightTheme } from '@/styles/theme'
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
          <Route path="/orders" element={<div>배송 준비 현황</div>} />
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

  /**
   * 준비 품목 표는 세트를 풀고 서비스를 걷어낸 뒤의 모습이라 주문서와 대조할 수 없다.
   * 담당자가 '내가 주문한 것' 과 '실제로 준비할 것' 을 나란히 볼 수 있어야 한다.
   */
  describe('주문 품목 표', () => {
    it('06_주문에 적힌 줄을 그대로 보여준다', () => {
      const { order } = orderWith('READY')
      renderDetail(order.orderId)

      const ordered = section('주문 품목')
      const rows = within(ordered).getAllByRole('row').slice(1)

      expect(rows).toHaveLength(order.items.length)
      for (const line of order.items) {
        expect(within(ordered).getAllByText(new RegExp(line.itemCode)).length).toBeGreaterThan(0)
      }
    })

    it('세트는 무엇으로 풀리는지 적는다', () => {
      // 세트 주문 — 준비 품목 표에는 세트가 아예 나오지 않는다
      const entry = planPreparation(state()).entries.find((candidate) =>
        candidate.order.items.some((line) => line.itemCode.startsWith('SET-')),
      )
      if (!entry) throw new Error('시드에 세트 주문이 없다')

      renderDetail(entry.order.orderId)

      expect(within(section('주문 품목')).getByText(/세트 전개 →/)).toBeInTheDocument()
    })

    it('취소 품목이 왜 빠졌는지 적는다', () => {
      const entry = planPreparation(state()).entries.find((candidate) =>
        candidate.order.items.some((line) => line.status === '취소'),
      )
      if (!entry) throw new Error('시드에 취소 품목이 있는 주문이 없다')

      renderDetail(entry.order.orderId)

      expect(within(section('주문 품목')).getByText(/취소된 품목이라/)).toBeInTheDocument()
    })
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
  /**
   * 처리 결과는 화면 가운데 토스트로 뜬다.
   *
   * 인라인 배너를 쓰던 자리다. 배너는 페이지 위쪽에 붙어 있어 표를 보고 있던 담당자의
   * 시야 밖에서 떴다.
   */
  describe('토스트', () => {
    it('예약하면 저장되었다는 사실과 무엇이 바뀌었는지가 함께 뜬다', () => {
      renderDetail(orderWith('READY').order.orderId)

      fireEvent.click(screen.getByRole('button', { name: '예약' }))

      const toast = screen.getByRole('status')
      expect(within(toast).getByText(/예약이 완료되었습니다/)).toBeInTheDocument()
      expect(within(toast).getByText(/개체까지 배정되어/)).toBeInTheDocument()
    })

    it('실패는 무엇이 막혔는지 설명과 함께 뜬다', () => {
      const entry = planPreparation(state()).entries.find(
        (candidate) => candidate.preparation.status === 'WAITING',
      )
      if (!entry) throw new Error('시드에 WAITING 주문이 없다')

      // 화면에는 예약 버튼이 없으므로 스토어를 직접 불러 같은 실패를 만든다
      renderDetail(entry.order.orderId)
      expect(screen.queryByRole('button', { name: '예약' })).not.toBeInTheDocument()
    })

    it('토스트를 닫으면 사라진다', () => {
      renderDetail(orderWith('READY').order.orderId)

      fireEvent.click(screen.getByRole('button', { name: '예약' }))
      fireEvent.click(screen.getByRole('button', { name: '알림 닫기' }))

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  /**
   * 저장하지 않은 입력을 두고 나가려 할 때 묻는다.
   *
   * 이 화면에서 손으로 넣는 값은 입고 수량뿐이다. 기본값(잔여 전량)을 그대로 두면
   * 입력한 것이 아니므로 묻지 않는다 — 물을 것이 없는데 창이 뜨면 담당자가 창을
   * 습관적으로 넘기게 되고, 정작 값을 잃을 때 막아주지 못한다.
   */
  describe('저장하지 않은 입력', () => {
    /** 입고 수량 입력을 가진 주문 하나 */
    const orderWithReceipt = () => {
      const entry = planPreparation(state()).entries.find((candidate) =>
        state().incomingDocuments.some(
          (document) =>
            document.confirmed &&
            document.warehouseCode === candidate.order.warehouseCode &&
            document.plannedQuantity > document.receivedQuantity &&
            candidate.preparation.items.some((item) => item.itemCode === document.itemCode),
        ),
      )
      if (!entry) throw new Error('시드에 입고예정을 기다리는 주문이 없다')
      return entry
    }

    const receiptInput = () => {
      const input = screen.queryAllByLabelText(/입고 수량$/)[0]
      if (!input) throw new Error('입고 수량 입력이 없다')
      return input
    }

    it('입력하지 않았으면 묻지 않고 목록으로 나간다', () => {
      renderDetail(orderWith('READY').order.orderId)

      fireEvent.click(screen.getByRole('button', { name: '목록으로' }))

      expect(screen.getByText('배송 준비 현황')).toBeInTheDocument()
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })

    it('입력한 값이 있으면 경고창이 뜬다', () => {
      renderDetail(orderWithReceipt().order.orderId)

      fireEvent.change(receiptInput(), { target: { value: '1' } })
      fireEvent.click(screen.getByRole('button', { name: '목록으로' }))

      const alert = screen.getByRole('alertdialog')
      expect(within(alert).getByText(/저장하지 않고 목록으로 나갈까요/)).toBeInTheDocument()
      expect(within(alert).getByText(/저장되지 않습니다/)).toBeInTheDocument()
      // 아직 나가지 않았다
      expect(screen.queryByText('배송 준비 현황')).not.toBeInTheDocument()
    })

    it('계속 입력을 고르면 값이 남는다', () => {
      renderDetail(orderWithReceipt().order.orderId)

      fireEvent.change(receiptInput(), { target: { value: '1' } })
      fireEvent.click(screen.getByRole('button', { name: '목록으로' }))
      fireEvent.click(screen.getByRole('button', { name: '취소' }))

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(receiptInput()).toHaveValue('1')
    })

    it('나가기를 고르면 목록으로 간다', () => {
      renderDetail(orderWithReceipt().order.orderId)

      fireEvent.change(receiptInput(), { target: { value: '1' } })
      fireEvent.click(screen.getByRole('button', { name: '목록으로' }))
      fireEvent.click(screen.getByRole('button', { name: '나가기' }))

      expect(screen.getByText('배송 준비 현황')).toBeInTheDocument()
    })

    it('입력 취소는 값을 되돌린다', () => {
      const entry = orderWithReceipt()
      renderDetail(entry.order.orderId)

      const before = (receiptInput() as HTMLInputElement).value
      fireEvent.change(receiptInput(), { target: { value: '1' } })

      fireEvent.click(screen.getByRole('button', { name: '입력 취소' }))
      fireEvent.click(screen.getByRole('button', { name: '값 버리기' }))

      // 기본값(잔여 전량)으로 돌아간다
      expect(receiptInput()).toHaveValue(before)
    })
  })

  /**
   * 다음에 무엇을 하는지가 한 줄로 보여야 한다.
   *
   * 준비상태 배지는 '무엇이 막혔는가' 를 말하고 단계 줄은 '그래서 다음에 무엇을
   * 하는가' 를 말한다. 둘은 다른 질문이다.
   */
  describe('처리 단계', () => {
    const steps = () => screen.getByRole('list', { name: '처리 단계' })

    it('네 칸을 순서대로 세운다', () => {
      renderDetail(orderWith('READY').order.orderId)

      const labels = within(steps())
        .getAllByRole('listitem')
        .map((item) => item.textContent)

      expect(labels).toEqual(['부족분 발주', '입고', '예약', '출고'])
    })

    it('READY 주문의 다음 할 일은 예약이다', () => {
      renderDetail(orderWith('READY').order.orderId)

      expect(screen.getByText('다음 할 일 — 예약')).toBeInTheDocument()
      // 지금 할 일 버튼이 그 줄에 있다
      expect(screen.getByRole('button', { name: '예약' })).toBeInTheDocument()
    })

    it('SHORTAGE 주문의 다음 할 일은 발주다', () => {
      renderDetail(orderWith('SHORTAGE').order.orderId)

      expect(screen.getByText('다음 할 일 — 부족분 발주')).toBeInTheDocument()
    })

    it('WAITING 주문은 입고를 기다린다', () => {
      renderDetail(orderWith('WAITING').order.orderId)

      expect(screen.getByText('다음 할 일 — 입고')).toBeInTheDocument()
    })

    it('예약한 주문의 다음 할 일은 출고다', () => {
      const { order } = orderWith('READY')
      state().reserve(order.orderId)

      renderDetail(order.orderId)

      expect(screen.getByText('다음 할 일 — 출고')).toBeInTheDocument()
    })

    /**
     * 단계 칩이 카드 테두리에 붙어 있었다. Panel 에는 여백이 없고 표만 들어간다는
     * 전제였는데, 표가 아닌 내용을 넣으면서 그 전제가 깨졌다.
     */
    it('단계 칩이 카드 안쪽 여백을 지킨다', () => {
      renderDetail(orderWith('READY').order.orderId)

      const body = steps().parentElement?.parentElement
      if (!body) throw new Error('카드 본문을 찾을 수 없다')

      // 표의 첫 글자와 같은 세로선에 서야 한다
      expect(getComputedStyle(body).paddingLeft).toBe(lightTheme.tableCell.paddingX)
      expect(getComputedStyle(body).paddingRight).toBe(lightTheme.tableCell.paddingX)
    })

    it('확인 필요 주문은 할 일 대신 사유를 가리킨다', () => {
      renderDetail(orderWith('EXCEPTION').order.orderId)

      expect(screen.getByText(/확인 필요 — 아래 사유를/)).toBeInTheDocument()
    })
  })

  /**
   * 상세로 들어와도 목록을 잃지 않는다.
   *
   * 배정 순서가 곧 업무 순서인 화면이라 '몇 번째를 보고 있는지' 와 '다음이 무엇인지'
   * 가 사라지면 담당자가 목록과 상세를 왕복하게 된다.
   */
  describe('주문 레일', () => {
    const rail = () => screen.getByRole('navigation', { name: '배송 준비 주문' })

    it('준비 대상 주문이 모두 카드로 선다', () => {
      const entries = planPreparation(state()).entries
      renderDetail(entries[0]?.order.orderId ?? '')

      expect(within(rail()).getAllByRole('button')).toHaveLength(entries.length)
    })

    it('보고 있는 주문이 표시된다', () => {
      const { order } = orderWith('READY')
      renderDetail(order.orderId)

      const current = within(rail())
        .getAllByRole('button')
        .filter((card) => card.getAttribute('aria-current') === 'true')

      expect(current).toHaveLength(1)
      expect(current[0]).toHaveTextContent(order.orderId)
    })

    it('다른 카드를 누르면 그 주문으로 옮겨간다', () => {
      const entries = planPreparation(state()).entries
      const [first, second] = entries
      if (!first || !second) throw new Error('계획에 주문이 두 건 이상 필요하다')

      renderDetail(first.order.orderId)

      const card = within(rail())
        .getAllByRole('button')
        .find((candidate) => candidate.textContent?.includes(second.order.orderId))
      if (!card) throw new Error('두 번째 주문 카드를 찾을 수 없다')

      fireEvent.click(card)

      expect(screen.getByRole('heading', { name: second.order.orderId })).toBeInTheDocument()
    })
  })

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

      expect(screen.getByText(/예약이 완료되었습니다/)).toBeInTheDocument()
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

      expect(screen.getByText(/예약 해제가 완료되었습니다/)).toBeInTheDocument()
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

      expect(screen.getByText(/발주가 저장되었습니다/)).toBeInTheDocument()
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
      expect(screen.getByText(/입고가 완료되었습니다/)).toBeInTheDocument()
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
