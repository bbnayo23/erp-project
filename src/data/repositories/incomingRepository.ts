import type { DocumentId, IncomingDocument, IncomingDocumentType, ItemCode } from '@/types'
import { dateOf } from '@/utils/date'

/**
 * 07_입고예정 문서번호 규칙: PO-YYYYMMDD-토큰 / MO-YYYYMMDD-토큰
 * (PO-20260719-DMN, MO-20260721-Z10)
 *
 * 토큰은 품목코드의 분류 접두사를 뗀 부분이다 — MAT-Z10-Q → Z10.
 */
const tokenOf = (itemCode: ItemCode): string => {
  const parts = itemCode.split('-')
  return (parts[1] ?? itemCode).toUpperCase()
}

export const incomingRepository = {
  find(documents: readonly IncomingDocument[], documentId: DocumentId) {
    return documents.find((document) => document.documentId === documentId)
  },

  replace(documents: readonly IncomingDocument[], next: IncomingDocument): IncomingDocument[] {
    return documents.map((document) => (document.documentId === next.documentId ? next : document))
  },

  add(documents: readonly IncomingDocument[], next: IncomingDocument): IncomingDocument[] {
    return [next, ...documents]
  },

  /**
   * 새 문서번호. 같은 날 같은 품목으로 두 번 발주하면 접미 번호가 붙는다 —
   * 화면에서 두 문서를 구분할 수 없으면 입고 처리를 잘못 누른다.
   */
  nextDocumentId(
    documents: readonly IncomingDocument[],
    type: IncomingDocumentType,
    itemCode: ItemCode,
    orderedAt: string,
  ): DocumentId {
    const prefix = type === '구매' ? 'PO' : 'MO'
    const base = `${prefix}-${dateOf(orderedAt).replace(/-/g, '')}-${tokenOf(itemCode)}`

    const taken = new Set(documents.map((document) => document.documentId))
    if (!taken.has(base)) return base

    let suffix = 2
    while (taken.has(`${base}-${suffix}`)) suffix += 1
    return `${base}-${suffix}`
  },
}
