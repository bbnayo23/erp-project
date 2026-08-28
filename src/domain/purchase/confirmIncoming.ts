import type { IncomingDocument, IncomingProgressStatus } from '@/types'

export type ConfirmFailure =
  /** 이미 확정된 문서 — 되돌릴 일이 아니라 아무것도 하지 않는다 */
  'ALREADY_CONFIRMED'

export interface ConfirmResult {
  ok: boolean
  failure?: ConfirmFailure
  document: IncomingDocument
}

/**
 * 확정 뒤의 진행상태.
 *
 * 구매는 공급처에 발주가 나간 상태(`발주 확정`), 생산은 공장이 작업을 시작한 상태
 * (`진행 중`)다. 같은 '확정' 이지만 그다음에 일어나는 일이 달라 상태값도 갈린다.
 */
const CONFIRMED_STATUS: Record<IncomingDocument['documentType'], IncomingProgressStatus> = {
  구매: '발주 확정',
  생산: '진행 중',
}

/**
 * 미확정 문서를 확정한다.
 *
 * 확정 전 문서는 아직 공급처에 나가지 않은 계획이라 판정에 쓰지 않는다 — 도착을 기대할
 * 근거가 없기 때문이다(`isIncomingPlanned`). 확정하는 순간 그 물량이 입고예정으로 잡히고,
 * 그 품목을 기다리던 주문이 `재고 부족` 에서 벗어난다.
 *
 * **재고는 움직이지 않는다.** 확정은 '이 물량을 세어도 된다' 는 선언일 뿐, 물건이 창고에
 * 들어오는 것은 입고 처리다.
 */
export function confirmIncoming(document: IncomingDocument): ConfirmResult {
  if (document.confirmed) return { ok: false, failure: 'ALREADY_CONFIRMED', document }

  return {
    ok: true,
    document: {
      ...document,
      confirmed: true,
      status: CONFIRMED_STATUS[document.documentType],
    },
  }
}
