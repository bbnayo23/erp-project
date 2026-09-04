import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useErpStore } from '@/store/erpStore'
import { findItem, isStockItem } from '@/domain/master/itemRules'
import { findWarehouse, isActiveWarehouse } from '@/domain/master/warehouseRules'
import { documentTypeOf } from '@/domain/purchase/createIncomingDocument'
import { DOCUMENT_TYPE_LABEL } from '@/features/purchase/utils'
import { ACTION_SUCCESS } from '@/features/preparation/messages'
import { useActionReport } from '@/features/preparation/useActionReport'
import { addDays, toDateInput } from '@/utils/date'
import type { IssueDraft, IssuePageState } from './types'

/**
 * 발주 생성 폼의 상태.
 *
 * 폼이 열리는 자리는 하나다 — 주문 상세의 부족 품목에서 넘어온다. 그래서 품목 · 창고 ·
 * 수량이 URL 로 미리 온다. 담당자가 빈 폼을 채우게 하면 규칙(출고창고 = 입고창고,
 * 품목유형 = 문서구분)을 사람이 지켜야 하는데, 그건 화면이 할 일이다.
 */
export const useIssuePage = (): IssuePageState => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const report = useActionReport()

  const items = useErpStore((state) => state.items)
  const warehouses = useErpStore((state) => state.warehouses)
  const suppliers = useErpStore((state) => state.suppliers)
  const baseAt = useErpStore((state) => state.baseAt)
  const issueIncoming = useErpStore((state) => state.issueIncoming)
  const confirmDocument = useErpStore((state) => state.confirm)
  const documents = useErpStore((state) => state.incomingDocuments)

  const itemCode = params.get('itemCode') ?? ''
  const warehouseCode = params.get('warehouseCode') ?? ''
  const sourceOrderId = params.get('orderId') ?? undefined
  const shortageQuantity = Number(params.get('quantity') ?? '0')

  const item = findItem(items, itemCode)
  const warehouse = findWarehouse(warehouses, warehouseCode)

  /**
   * 폼을 채울 수 없는 경우를 먼저 가른다.
   *
   * 미등록 품목이나 사용 중지 창고로는 발주할 수 없다 — 폼을 열어 두고 제출에서 막으면
   * 담당자가 다 채운 뒤에야 안 된다는 것을 안다.
   */
  const problem = (() => {
    if (!item) return `등록되지 않은 품목입니다. (${itemCode})`
    if (!isStockItem(item)) return `${item.itemType}은(는) 발주 대상이 아닙니다.`
    if (!warehouse) return `등록되지 않은 창고입니다. (${warehouseCode})`
    if (!isActiveWarehouse(warehouse)) return '사용 중지된 창고로는 발주할 수 없습니다.'
    return undefined
  })()

  const documentType = item && isStockItem(item) ? documentTypeOf(item) : undefined

  /** 문서구분에 맞는 공급처만 — 구매발주에 생산처를 고를 수 없다 */
  const candidates = useMemo(
    () =>
      suppliers.filter((supplier) =>
        documentType === '생산' ? supplier.type === '생산처' : supplier.type === '구매처',
      ),
    [suppliers, documentType],
  )

  const defaultSupplier = item?.defaultSupplierCode ?? candidates[0]?.supplierCode ?? ''
  const leadTime =
    candidates.find((supplier) => supplier.supplierCode === defaultSupplier)?.leadTimeDays ?? 0
  const suggestedDate = addDays(baseAt, leadTime)

  const [draft, setDraftState] = useState<IssueDraft>({
    quantity: String(shortageQuantity > 0 ? shortageQuantity : 1),
    supplierCode: defaultSupplier,
    availableDate: toDateInput(suggestedDate),
    confirmImmediately: true,
  })

  const setDraft = useCallback((patch: Partial<IssueDraft>) => {
    setDraftState((previous) => ({ ...previous, ...patch }))
  }, [])

  const quantity = Number(draft.quantity)
  const invalid = (() => {
    if (!Number.isFinite(quantity) || quantity <= 0) return '수량은 1개 이상이어야 합니다.'
    if (!draft.supplierCode) return '공급처를 고르세요.'
    if (!draft.availableDate) return '사용가능예정일을 넣으세요.'
    return undefined
  })()

  return {
    context:
      item && warehouse && documentType
        ? {
            itemCode: item.itemCode,
            itemName: item.itemName,
            itemType: item.itemType,
            documentTypeLabel: DOCUMENT_TYPE_LABEL[documentType],
            warehouseCode: warehouse.warehouseCode,
            warehouseName: warehouse.warehouseName,
            ...(sourceOrderId ? { sourceOrderId } : {}),
            shortageQuantity,
          }
        : null,
    ...(problem ? { problem } : {}),

    draft,
    setDraft,

    supplierOptions: candidates.map((supplier) => ({
      value: supplier.supplierCode,
      label: `${supplier.supplierName} (리드타임 ${supplier.leadTimeDays}일)`,
    })),
    suggestedDate,

    ...(invalid ? { invalid } : {}),

    submit: () => {
      if (invalid || !item || !warehouse) return

      const before = new Set(documents.map((document) => document.documentId))

      const outcome = issueIncoming(
        [
          {
            itemCode: item.itemCode,
            warehouseCode: warehouse.warehouseCode,
            requiredQuantity: quantity,
            shortageQuantity: quantity,
            orderIds: sourceOrderId ? [sourceOrderId] : [],
          },
        ],
        `ISSUE:FORM:${item.itemCode}:${warehouse.warehouseCode}:${quantity}`,
      )

      if (!report(outcome, ACTION_SUCCESS.ISSUE)) return

      /*
       * 만들자마자 확정한다.
       *
       * 확정하지 않으면 판정에 쓰이지 않아, 담당자가 발주를 냈는데도 주문이 여전히
       * '재고 부족' 으로 남는다. 그 상태를 원할 때만 체크를 푼다.
       */
      if (draft.confirmImmediately) {
        const created = useErpStore
          .getState()
          .incomingDocuments.find((document) => !before.has(document.documentId))
        if (created) confirmDocument(created.documentId)
      }

      navigate('/inbound')
    },

    cancel: () => navigate(sourceOrderId ? `/orders/${sourceOrderId}` : '/inbound'),
  }
}
