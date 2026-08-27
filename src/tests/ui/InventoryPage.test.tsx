// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { InventoryPage } from '@/pages/InventoryPage'
import { useErpStore } from '@/store/erpStore'
import { findInventory } from '@/domain/inventory/getAvailableQuantity'
import { planPreparation } from '@/domain/preparation/planPreparation'
import { toStockRows } from '@/features/inventory/utils'

/**
 * 재고 현황의 렌더와 개체재고 조회.
 *
 * 재고를 바꾸는 버튼이 없는 화면이라 이 테스트가 지키는 것은 숫자가 정확히 옮겨지는지와,
 * 다른 화면과 어긋나 보이는 지점을 화면이 스스로 설명하는지다 — 이 화면의 가용재고는
 * 창고 총량이고 주문 상세의 가용재고는 선행 주문 몫을 뺀 나머지다.
 */
describe('InventoryPage', () => {
  const state = () => useErpStore.getState()

  /** 선행 예약이 걸린 시리얼 관리 품목 (현재고 3 · 예약 1) */
  const SERIAL_ITEM = 'MAT-Z10-Q'
  const HQ = 'WH-HQ'

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/items']}>
        <InventoryPage />
      </MemoryRouter>,
      { wrapper: AppProviders },
    )

  const stockTable = () => screen.getAllByRole('table')[0] as HTMLElement

  const bodyRows = () => within(stockTable()).getAllByRole('row').slice(1)

  const rowOf = (itemCode: string, warehouseName: string) => {
    const row = bodyRows().find(
      (candidate) =>
        within(candidate).queryByText(new RegExp(itemCode)) &&
        within(candidate).queryByText(warehouseName),
    )
    if (!row) throw new Error(`${itemCode} / ${warehouseName} 행을 찾을 수 없다`)
    return row
  }

  const allRows = () => toStockRows(state())

  const drawer = () => screen.getByRole('dialog')

  /** 서랍 안의 n번째 표 — 0 개체 · 1 대기 주문 · 2 입고예정 · 3 이력 */
  const drawerTable = (index: number) =>
    within(drawer()).getAllByRole('table')[index] as HTMLElement

  const serialTable = () => drawerTable(0)

  beforeEach(() => {
    state().reset()
  })

  afterEach(() => {
    cleanup()
  })

  it('품목 × 창고가 한 줄씩 그려진다', () => {
    renderPage()

    const expected = allRows().length

    expect(screen.getByText('제품')).toBeInTheDocument()
    expect(bodyRows()).toHaveLength(expected)
    expect(screen.getByText(`전체 ${expected}건`)).toBeInTheDocument()
  })

  it('현재고 · 예약 · 가용재고를 나란히 보여준다', () => {
    renderPage()

    const inventory = findInventory(state().inventories, SERIAL_ITEM, HQ)
    if (!inventory) throw new Error('시드에 MAT-Z10-Q / WH-HQ 재고가 없다')

    const cells = within(rowOf(SERIAL_ITEM, '본사물류창고')).getAllByRole('cell')

    // 품목 · 창고 다음이 현재고 · 예약 · 가용재고다
    expect(cells[2]).toHaveTextContent(String(inventory.currentQuantity))
    expect(cells[3]).toHaveTextContent(String(inventory.reservedQuantity))
    expect(cells[4]).toHaveTextContent(
      String(inventory.currentQuantity - inventory.reservedQuantity),
    )
  })

  /**
   * 이 화면의 가용재고는 창고 총량이고, 주문 상세의 가용재고는 배송일이 앞선 주문이
   * 가져간 몫을 뺀 나머지다. 같은 이름의 두 숫자가 어긋나 보일 수 있으므로 화면이
   * 기준을 밝혀야 한다.
   */
  it('가용재고의 기준을 머리말에 밝힌다', () => {
    renderPage()

    expect(screen.getByText(/창고 총량 기준/)).toBeInTheDocument()
    expect(screen.getByText(/배송일이 앞선 주문이 가져간 몫/)).toBeInTheDocument()
    expect(screen.getByText(/2026\.07\.21 09:00/)).toBeInTheDocument()
  })

  it('사용 중지 창고의 재고도 감추지 않는다', () => {
    renderPage()

    // WH-LEGACY 는 재고와 개체가 남아 있지만 출고 준비 대상이 아니다. 숨기면 담당자가
    // 창고 합계와 화면 합계가 왜 다른지 알 수 없다.
    const row = rowOf(SERIAL_ITEM, '구창고(비활성)')
    expect(within(row).getByText('사용 중지')).toBeInTheDocument()
  })

  /**
   * 아직 그 창고에 없는 품목을 발주하면 04_재고현황에는 행이 생기지 않는다. 입고해야
   * 생긴다. 그 사이 재고 화면이 아무것도 보여주지 않으면 담당자는 발주가 사라진 줄 안다.
   */
  it('재고 행이 없어도 확정된 입고예정이 있으면 한 줄로 선다', () => {
    // 제로 베개는 8창고·청주에만 있다. 본사물류창고로 새로 발주한다.
    expect(findInventory(state().inventories, 'PIL-ZERO', HQ)).toBeUndefined()

    const outcome = state().issueIncoming(
      [
        {
          itemCode: 'PIL-ZERO',
          warehouseCode: HQ,
          requiredQuantity: 5,
          shortageQuantity: 5,
          orderIds: [],
        },
      ],
      'TEST:ISSUE:PIL-ZERO',
    )
    expect(outcome.ok).toBe(true)

    renderPage()

    const row = rowOf('PIL-ZERO', '본사물류창고')
    const cells = within(row).getAllByRole('cell')

    expect(cells[2]).toHaveTextContent('0')
    expect(cells[5]).toHaveTextContent('5')
    expect(within(row).getByText('입고 예정')).toBeInTheDocument()
  })

  it('요약 카드가 전체 합계를 보여준다', () => {
    renderPage()

    const summary = screen.getByRole('list', { name: '재고 요약' })

    for (const label of ['품목 × 창고', '현재고', '예약수량', '가용재고', '지금 쓸 수 있음']) {
      expect(within(summary).getByText(label)).toBeInTheDocument()
    }
    expect(within(summary).getByText(`${allRows().length}건`)).toBeInTheDocument()
  })

  /**
   * 합계 카드는 걸러낼 대상이 아니라 총량이다. 버튼으로 두면 눌러도 아무 일이 없는
   * 자리가 생기므로 상태 카드만 누를 수 있어야 한다.
   */
  it('상태 카드만 필터 버튼이 된다', () => {
    renderPage()

    const summary = screen.getByRole('list', { name: '재고 요약' })
    const names = within(summary)
      .getAllByRole('button')
      .map((button) => button.textContent ?? '')

    expect(names.some((name) => name.includes('지금 쓸 수 있음'))).toBe(true)
    expect(names.some((name) => name.includes('예약수량'))).toBe(false)
  })

  it('요약 카드를 누르면 그 상태만 남고, 다시 누르면 풀린다', () => {
    renderPage()

    const summary = screen.getByRole('list', { name: '재고 요약' })
    const card = within(summary)
      .getAllByRole('button')
      .find((button) => (button.textContent ?? '').includes('지금 쓸 수 있음'))
    if (!card) throw new Error('배정 가능 카드를 찾을 수 없다')

    fireEvent.click(card)
    expect(bodyRows()).toHaveLength(allRows().filter((row) => row.level === 'AVAILABLE').length)
    expect(card).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(card)
    expect(bodyRows()).toHaveLength(allRows().length)
  })

  describe('필터', () => {
    it('재고 상태로 좁힌다', () => {
      renderPage()

      fireEvent.change(screen.getByLabelText('재고 상태'), { target: { value: 'AVAILABLE' } })

      const expected = allRows().filter((row) => row.level === 'AVAILABLE').length
      expect(bodyRows()).toHaveLength(expected)
      expect(screen.getByText(`${expected}건 / 전체 ${allRows().length}건`)).toBeInTheDocument()
    })

    it('창고로 좁힌다', () => {
      renderPage()

      fireEvent.change(screen.getByLabelText('창고'), { target: { value: 'WH-LEGACY' } })

      const expected = allRows().filter((row) => row.warehouseCode === 'WH-LEGACY').length
      expect(bodyRows()).toHaveLength(expected)
    })

    it('조건에 맞는 재고가 없으면 초기화할 길을 준다', () => {
      renderPage()

      fireEvent.change(screen.getByLabelText('품목 검색'), {
        target: { value: '존재하지 않는 품목' },
      })
      expect(screen.getByText('조건에 맞는 재고가 없습니다')).toBeInTheDocument()

      fireEvent.click(screen.getAllByRole('button', { name: '필터 초기화' })[0] as HTMLElement)
      expect(bodyRows()).toHaveLength(allRows().length)
    })
  })

  describe('개체재고', () => {
    it('시리얼 관리 품목이 아니면 열 버튼이 없다', () => {
      renderPage()

      // 방수커버는 수량으로만 관리한다 — 매트리스·프레임만 개체 단위다
      const row = rowOf('CVR-WP-K', '본사물류창고')
      expect(within(row).queryByRole('button')).not.toBeInTheDocument()
    })

    it('개체 수 버튼을 누르면 서랍에 개체 목록이 나온다', () => {
      renderPage()

      fireEvent.click(within(rowOf(SERIAL_ITEM, '본사물류창고')).getByRole('button'))

      const expected = state().serials.filter(
        (serial) => serial.itemCode === SERIAL_ITEM && serial.warehouseCode === HQ,
      )

      // 서랍의 첫 표가 개체 목록이다. 뒤로 대기 주문 · 입고예정 · 이력 표가 이어진다.
      expect(within(serialTable()).getAllByRole('row').slice(1)).toHaveLength(expected.length)
      for (const serial of expected) {
        expect(within(serialTable()).getByText(serial.serialNumber)).toBeInTheDocument()
      }
    })

    /**
     * 재고 화면의 본질은 '믿을 수 있나' 다. 숫자를 나열하는 것으로는 답이 되지 않고,
     * 숫자끼리 맞아떨어지는 것을 화면에서 보여줘야 한다.
     */
    it('두 항등식을 화면에서 검산할 수 있다', () => {
      renderPage()

      fireEvent.click(within(rowOf(SERIAL_ITEM, '본사물류창고')).getByRole('button'))

      const inventory = findInventory(state().inventories, SERIAL_ITEM, HQ)
      if (!inventory) throw new Error('시드에 MAT-Z10-Q / WH-HQ 재고가 없다')

      // 가용재고 = 현재고 − 예약수량
      const available = screen.getByTestId('identity-available')
      expect(available).toHaveTextContent(
        new RegExp(
          `${inventory.currentQuantity - inventory.reservedQuantity}.*현재고 ${inventory.currentQuantity}.*예약 ${inventory.reservedQuantity}`,
        ),
      )

      // 현재고 = 보관 + 배정 (출고 완료 개체는 창고를 떠났으므로 세지 않는다)
      const stored = state().serials.filter(
        (serial) =>
          serial.itemCode === SERIAL_ITEM &&
          serial.warehouseCode === HQ &&
          serial.status !== '출고 완료',
      ).length

      const serial = screen.getByTestId('identity-serial')
      expect(stored).toBe(inventory.currentQuantity)
      expect(serial).toHaveTextContent(/= 보관/)
      expect(serial).not.toHaveAttribute('aria-invalid')
    })

    /** 어긋나면 등호가 ≠ 로 바뀌어야 한다 — 수량이 맞아 보여도 예약이 막히는 원인이다 */
    it('개체 수가 현재고와 어긋나면 등호가 깨진 것으로 표시된다', () => {
      const mismatched = allRows().find((row) => row.serialMismatch)
      if (!mismatched) return

      renderPage()
      fireEvent.click(rowOf(mismatched.itemCode, mismatched.warehouseName))

      const serial = screen.getByTestId('identity-serial')
      expect(serial).toHaveTextContent(/≠ 보관/)
      expect(serial).toHaveAttribute('aria-invalid', 'true')
    })

    it('닫으면 서랍이 사라진다', () => {
      renderPage()

      fireEvent.click(within(rowOf(SERIAL_ITEM, '본사물류창고')).getByRole('button'))
      fireEvent.click(screen.getByRole('button', { name: '닫기' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  /**
   * 재고 숫자 하나를 보고 담당자가 이어서 묻는 것 — 누가 이 물건을 기다리는가,
   * 무엇이 들어오기로 되어 있는가 — 에 같은 화면이 답해야 한다.
   */
  describe('품목 상세', () => {
    it('시리얼 품목이 아니어도 행을 누르면 서랍이 열린다', () => {
      renderPage()

      fireEvent.click(rowOf('CVR-WP-K', '본사물류창고'))

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('이 품목을 기다리는 주문이 배정 순서와 함께 나온다', () => {
      renderPage()

      fireEvent.click(rowOf(SERIAL_ITEM, '본사물류창고'))

      const expected = planPreparation(state()).entries.filter(
        (entry) =>
          entry.order.warehouseCode === HQ &&
          entry.preparation.items.some((item) => item.itemCode === SERIAL_ITEM),
      )
      expect(expected.length).toBeGreaterThan(0)

      const demands = drawerTable(1)
      expect(within(demands).getAllByRole('row').slice(1)).toHaveLength(expected.length)
      for (const entry of expected) {
        expect(within(demands).getByText(entry.order.orderId)).toBeInTheDocument()
      }
    })

    it('이 품목으로 걸려 있는 문서가 나온다', () => {
      renderPage()

      fireEvent.click(rowOf(SERIAL_ITEM, '본사물류창고'))

      const expected = state().incomingDocuments.filter(
        (document) => document.itemCode === SERIAL_ITEM && document.warehouseCode === HQ,
      )
      expect(expected.length).toBeGreaterThan(0)

      const documents = drawerTable(2)
      for (const document of expected) {
        expect(within(documents).getByText(document.documentId)).toBeInTheDocument()
      }
    })

    it('예약하면 그 사실이 이력에 남는다', () => {
      const entry = planPreparation(state()).entries.find(
        (candidate) =>
          candidate.preparation.status === 'READY' &&
          candidate.order.warehouseCode === HQ &&
          candidate.preparation.items.some((item) => item.itemCode === SERIAL_ITEM),
      )
      if (!entry) throw new Error('시드에 MAT-Z10-Q 를 쓰는 READY 주문이 없다')

      state().reserve(entry.order.orderId)
      renderPage()

      // 페이지 하단의 전체 이력 — 예약은 현재고를 건드리지 않는다
      const history = screen.getAllByRole('table')[1] as HTMLElement
      const row = within(history)
        .getAllByRole('row')
        .find((candidate) => within(candidate).queryByText(entry.order.orderId))
      if (!row) throw new Error('예약 이력이 없다')

      expect(within(row).getByText('예약')).toBeInTheDocument()
    })
  })

  /**
   * 예약은 04_재고현황의 예약수량과 05_개체재고의 개체상태를 함께 옮긴다.
   * 두 숫자가 같은 액션에서 움직이는지는 이 화면에서만 한눈에 보인다.
   */
  it('예약하면 예약수량이 늘고 가용재고가 준다', () => {
    const entry = planPreparation(state()).entries.find(
      (candidate) =>
        candidate.preparation.status === 'READY' &&
        candidate.order.warehouseCode === HQ &&
        candidate.preparation.items.some((item) => item.itemCode === SERIAL_ITEM),
    )
    if (!entry) throw new Error('시드에 MAT-Z10-Q 를 쓰는 READY 주문이 없다')

    const before = findInventory(state().inventories, SERIAL_ITEM, HQ)
    state().reserve(entry.order.orderId)
    const after = findInventory(state().inventories, SERIAL_ITEM, HQ)

    renderPage()

    const cells = within(rowOf(SERIAL_ITEM, '본사물류창고')).getAllByRole('cell')
    expect(after?.reservedQuantity).toBeGreaterThan(before?.reservedQuantity ?? 0)
    expect(cells[3]).toHaveTextContent(String(after?.reservedQuantity))
    expect(cells[4]).toHaveTextContent(
      String((after?.currentQuantity ?? 0) - (after?.reservedQuantity ?? 0)),
    )
  })
})
