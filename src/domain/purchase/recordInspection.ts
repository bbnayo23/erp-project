import type { IncomingDocument, Quantity } from '@/types'
import { getRemainingQuantity, isInspectionPending } from './getRemainingQuantity'

export type InspectionFailure =
  /** 검사 대기 상태가 아니어서 기록할 것이 없다 */
  | 'NOT_PENDING_INSPECTION'
  /** 합격 + 불합격이 남은 수량과 맞지 않는다 */
  | 'QUANTITY_MISMATCH'
  | 'INVALID_QUANTITY'

export interface InspectionInput {
  document: IncomingDocument
  /** 검사를 통과해 입고할 수 있는 수량 */
  passedQuantity: Quantity
  /** 폐기·반품될 수량 */
  failedQuantity: Quantity
  note?: string
}

export interface InspectionResult {
  ok: boolean
  failure?: InspectionFailure
  document: IncomingDocument
}

/**
 * 품질검사 결과를 기록한다.
 *
 * 생산의뢰는 이 기록 없이 입고할 수 없다. 검사를 통과하지 않은 물량은 창고에 들어와도
 * 팔 수 있는 재고가 아니기 때문이다 — 명세가 "검사 결과 기록 없이 입고되면 안 된다" 로
 * 못 박은 자리다.
 *
 * **불합격 수량만큼 계획수량이 줄어든다.** 계획 2개 중 1개가 불합격이면 앞으로 들어올
 * 수 있는 것은 1개뿐이다. 계획을 그대로 두면 잔여가 1로 남아, 담당자가 오지 않을 물량을
 * 계속 기다리고 그 주문은 영영 `입고 대기` 에 머문다.
 *
 * 전량 불합격이면 계획수량이 이미 입고한 만큼으로 줄어 잔여가 0이 된다 — 더 받을 것이
 * 없는 문서가 되고, 그 물량을 기다리던 주문은 다음 판정에서 `재고 부족` 으로 내려가
 * 발주 대상이 된다. 이것이 올바른 결과다.
 */
export const recordInspection = ({
  document,
  passedQuantity,
  failedQuantity,
  note,
}: InspectionInput): InspectionResult => {
  const unchanged = { document }

  if (!isInspectionPending(document)) {
    return { ok: false, failure: 'NOT_PENDING_INSPECTION', ...unchanged }
  }

  if (passedQuantity < 0 || failedQuantity < 0) {
    return { ok: false, failure: 'INVALID_QUANTITY', ...unchanged }
  }

  const remaining = getRemainingQuantity(document)
  if (passedQuantity + failedQuantity !== remaining) {
    return { ok: false, failure: 'QUANTITY_MISMATCH', ...unchanged }
  }

  return {
    ok: true,
    document: {
      ...document,
      inspectionStatus: '검사 완료',
      status: '검사 완료',
      // 불합격분은 앞으로도 들어오지 않는다 — 계획에서 덜어내야 잔여가 진실이 된다
      plannedQuantity: document.plannedQuantity - failedQuantity,
      ...(note ? { inspectionNote: note } : {}),
    },
  }
}
