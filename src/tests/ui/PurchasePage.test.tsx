// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { PurchasePage } from '@/pages/PurchasePage'
import { useErpStore } from '@/store/erpStore'
import { findInventory } from '@/domain/inventory/getAvailableQuantity'
import { stageOf } from '@/features/purchase/utils'

/**
 * 발주 현황의 렌더와 액션.
 *
 * 스토어 테스트가 검사·입고의 결과를 지키고, 이 테스트는 담당자가 그 액션에 닿을 수
 * 있는지를 본다. 주문 상세에도 같은 두 버튼이 있지만 거기에는 그 주문이 기다리는 문서만
 * 나온다 — 어느 주문에도 걸리지 않은 문서까지 처리할 수 있는지가 이 화면의 존재 이유다.
 */
describe('PurchasePage', () => {
  const state = () => useErpStore.getState()

  /** 사용 중지 창고로 들어오는 문서. 출고 준비 대상 주문이 기다릴 수 없는 물량이다. */
  const LEGACY_DOCUMENT = 'PO-LEGACY-Z10'
  /** 검사 대기 생산의뢰 */
  const INSPECT_DOCUMENT = 'MO-20260721-Z10'
  /** 확정되지 않은 '작성 중' 문서 */
  const DRAFT_DOCUMENT = 'PO-20260721-PIL'
  /** 부분 입고 — 계획 3, 입고 1 */
  const PARTIAL_DOCUMENT = 'PO-20260719-DMN'

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/inbound']}>
        <Routes>
          <Route path="/inbound" element={<PurchasePage />} />
          <Route path="/orders/:orderId" element={<div>주문 상세</div>} />
        </Routes>
      </MemoryRouter>,
      { wrapper: AppProviders },
    )

  const bodyRows = () => {
    // 첫 표가 문서 목록, 둘째 표가 입고 이력이다
    const table = screen.getAllByRole('table')[0] as HTMLElement
    // thead 한 줄을 뺀다
    return within(table).getAllByRole('row').slice(1)
  }

  /** 문서번호가 적힌 행 */
  const rowOf = (documentId: string) => {
    const row = bodyRows().find((candidate) => within(candidate).queryByText(documentId))
    if (!row) throw new Error(`${documentId} 행을 찾을 수 없다`)
    return row
  }

  const findDocument = (documentId: string) => {
    const document = state().incomingDocuments.find(
      (candidate) => candidate.documentId === documentId,
    )
    if (!document) throw new Error(`${documentId} 문서가 시드에 없다`)
    return document
  }

  const countStage = (stage: string) =>
    state().incomingDocuments.filter((document) => stageOf(document, state().baseAt) === stage)
      .length

  beforeEach(() => {
    state().reset()
  })

  afterEach(() => {
    cleanup()
  })

  it('입고예정 문서가 모두 표에 그려진다', () => {
    renderPage()

    const expected = state().incomingDocuments.length

    expect(screen.getByText('발주')).toBeInTheDocument()
    expect(bodyRows()).toHaveLength(expected)
    expect(screen.getByText(`전체 ${expected}건`)).toBeInTheDocument()
  })

  /**
   * 주문 상세는 그 주문이 기다리는 문서만 보여준다. 사용 중지 창고로 들어오는 물량은
   * 어느 준비 대상 주문의 근거도 되지 못하므로, 이 화면이 없으면 입고할 길이 없다.
   */
  it('어느 주문에도 걸리지 않은 문서까지 처리할 수 있다', () => {
    renderPage()

    const row = rowOf(LEGACY_DOCUMENT)

    expect(within(row).getByText('구창고(비활성)')).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: '입고' })).toBeInTheDocument()
  })

  it('처리할 문서가 위로 온다', () => {
    renderPage()

    // STAGE_ORDER 의 첫 단계가 검사 대기다 — 담당자가 먼저 손대야 하는 문서다
    const first = bodyRows()[0] as HTMLElement
    expect(within(first).getByText('검사 대기')).toBeInTheDocument()
  })

  it('요약 카드가 단계별 건수를 보여준다', () => {
    renderPage()

    const summary = screen.getByRole('list', { name: '입고예정 단계 요약' })

    for (const label of [
      '입고예정 문서 전체',
      '검사할 것',
      '입고할 것',
      '기다리는 것',
      '확정 안 됨',
    ]) {
      expect(within(summary).getByText(label)).toBeInTheDocument()
    }
    expect(within(summary).getByText(`${state().incomingDocuments.length}건`)).toBeInTheDocument()
  })

  it('07_입고예정의 진행상태와 검사상태를 그대로 남긴다', () => {
    renderPage()

    // 단계는 앱이 만든 축이다. 원본 값이 옆에 있어야 담당자가 판정을 검산할 수 있다.
    const row = rowOf(INSPECT_DOCUMENT)
    expect(within(row).getByText('생산 완료')).toBeInTheDocument()
    expect(within(row).getByText('검사 검사 대기')).toBeInTheDocument()
  })

  it('부분 입고 문서는 계획·입고·잔여가 함께 보인다', () => {
    renderPage()

    const row = rowOf(PARTIAL_DOCUMENT)
    const cells = within(row).getAllByRole('cell')

    // 문서번호 · 품목 · 입고창고 다음이 계획 · 입고 · 잔여다
    expect(cells[3]).toHaveTextContent('3')
    expect(cells[4]).toHaveTextContent('1')
    expect(cells[5]).toHaveTextContent('2')
  })

  describe('필터', () => {
    it('단계로 좁힌다', () => {
      renderPage()

      fireEvent.change(screen.getByLabelText('단계'), { target: { value: 'INSPECT' } })

      const expected = countStage('INSPECT')
      expect(bodyRows()).toHaveLength(expected)
      expect(screen.getByText(`${expected}건 / 전체 12건`)).toBeInTheDocument()
    })

    it('문서번호로도 품목명으로도 찾는다', () => {
      renderPage()

      fireEvent.change(screen.getByLabelText('문서번호·품목 검색'), {
        target: { value: LEGACY_DOCUMENT },
      })
      expect(bodyRows()).toHaveLength(1)

      const itemName = state().items.find(
        (item) => item.itemCode === findDocument(LEGACY_DOCUMENT).itemCode,
      )?.itemName
      fireEvent.change(screen.getByLabelText('문서번호·품목 검색'), {
        target: { value: itemName ?? '' },
      })
      expect(bodyRows().length).toBeGreaterThanOrEqual(1)
    })

    it('조건에 맞는 문서가 없으면 초기화할 길을 준다', () => {
      renderPage()

      fireEvent.change(screen.getByLabelText('문서번호·품목 검색'), {
        target: { value: '존재하지 않는 문서' },
      })
      expect(screen.getByText('조건에 맞는 문서가 없습니다')).toBeInTheDocument()

      fireEvent.click(screen.getAllByRole('button', { name: '필터 초기화' })[0] as HTMLElement)
      expect(bodyRows()).toHaveLength(state().incomingDocuments.length)
    })
  })

  describe('처리', () => {
    /**
     * 미확정 문서는 아직 공급처에 나가지 않은 계획이다. 검사도 입고도 시작할 수 없으므로
     * 버튼을 회색으로 남기지 않고 아예 내지 않는다 — 이유는 단계 칸이 말한다.
     */
    it('미확정 문서에는 처리 버튼이 없다', () => {
      renderPage()

      const row = rowOf(DRAFT_DOCUMENT)

      // 단계 배지와 진행상태 칸의 확정여부 — 두 자리 모두 '미확정' 이라 적는다
      expect(within(row).getAllByText('미확정').length).toBeGreaterThan(0)
      expect(within(row).queryByRole('button')).not.toBeInTheDocument()
    })

    it('검사를 통과시키면 입고할 수 있게 된다', () => {
      renderPage()

      const before = rowOf(INSPECT_DOCUMENT)
      expect(within(before).queryByRole('button', { name: '입고' })).not.toBeInTheDocument()

      fireEvent.click(within(before).getByRole('button', { name: '검사 통과' }))

      expect(findDocument(INSPECT_DOCUMENT).inspectionStatus).toBe('검사 완료')
      expect(within(rowOf(INSPECT_DOCUMENT)).getByRole('button', { name: '입고' })).toBeVisible()
    })

    /** 부분 입고가 예외이고 전량 입고가 보통이다 */
    it('입고 수량은 잔여수량으로 기본 채워진다', () => {
      renderPage()

      const input = screen.getByLabelText(`${PARTIAL_DOCUMENT} 입고 수량`)
      expect(input).toHaveValue('2')
    })

    it('입고하면 현재고가 늘고 잔여가 줄어든다', () => {
      renderPage()

      const document = findDocument(LEGACY_DOCUMENT)
      const before =
        findInventory(state().inventories, document.itemCode, document.warehouseCode)
          ?.currentQuantity ?? 0

      fireEvent.change(screen.getByLabelText(`${LEGACY_DOCUMENT} 입고 수량`), {
        target: { value: '4' },
      })
      fireEvent.click(within(rowOf(LEGACY_DOCUMENT)).getByRole('button', { name: '입고' }))

      expect(findDocument(LEGACY_DOCUMENT).receivedQuantity).toBe(4)
      expect(
        findInventory(state().inventories, document.itemCode, document.warehouseCode)
          ?.currentQuantity,
      ).toBe(before + 4)

      // 입력은 비워져 남은 잔여로 다시 채워진다
      expect(screen.getByLabelText(`${LEGACY_DOCUMENT} 입고 수량`)).toHaveValue('6')
    })

    /**
     * 문서 목록의 '입고수량' 은 누적 합계라 이번에 얼마가 들어왔는지 말하지 않고,
     * 그 입고로 어느 주문이 풀렸는지도 말하지 않는다.
     */
    it('입고하면 얼마가 늘었고 현재고가 얼마가 됐는지 이력에 남는다', () => {
      renderPage()

      const document = findDocument(LEGACY_DOCUMENT)

      fireEvent.change(screen.getByLabelText(`${LEGACY_DOCUMENT} 입고 수량`), {
        target: { value: '4' },
      })
      fireEvent.click(within(rowOf(LEGACY_DOCUMENT)).getByRole('button', { name: '입고' }))

      const history = screen.getAllByRole('table')[1] as HTMLElement
      const row = within(history)
        .getAllByRole('row')
        .find((candidate) => within(candidate).queryByText(LEGACY_DOCUMENT))
      if (!row) throw new Error('입고 이력이 없다')

      const current =
        findInventory(state().inventories, document.itemCode, document.warehouseCode)
          ?.currentQuantity ?? 0

      expect(within(row).getByText('+4')).toBeInTheDocument()
      expect(within(row).getByText(String(current))).toBeInTheDocument()
    })

    it('입고하기 전에는 이력이 비어 있다', () => {
      renderPage()

      expect(screen.getByText('아직 입고한 문서가 없습니다')).toBeInTheDocument()
    })

    /** 초과 입고는 발주서를 먼저 고쳐야 하는 사건이다 — 조용히 잘라 넣지 않는다 */
    it('잔여를 넘는 입고는 이유를 알려준다', () => {
      renderPage()

      fireEvent.change(screen.getByLabelText(`${PARTIAL_DOCUMENT} 입고 수량`), {
        target: { value: '99' },
      })
      fireEvent.click(within(rowOf(PARTIAL_DOCUMENT)).getByRole('button', { name: '입고' }))

      expect(screen.getByText(/잔여수량을 넘는 입고입니다/)).toBeInTheDocument()
      expect(findDocument(PARTIAL_DOCUMENT).receivedQuantity).toBe(1)
    })
  })
})
