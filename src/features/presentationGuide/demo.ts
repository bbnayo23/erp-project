import { planPreparation } from '@/domain/preparation/planPreparation'
import { calculateShortage } from '@/domain/purchase/calculateShortage'
import { useErpStore } from '@/store/erpStore'
import type { DocumentId, ErpDatabase, OrderId } from '@/types'

/** 가이드가 끝까지 따라가는 주문 */
export const DEMO_ORDER: OrderId = 'ORD202607210029'
/** Z10 매트리스 Q 생산의뢰 — 검사를 거쳐야 입고되는 문서 */
const DEMO_PRODUCTION: DocumentId = 'MO-20260721-Z10'
/** 데이먼 프레임 Q 구매발주 — 계획 3 · 기존 입고 1 의 부분 입고 문서 */
const DEMO_PURCHASE: DocumentId = 'PO-20260719-DMN'

/**
 * 시연 단계.
 *
 * 발표 순서에서 "결과를 보여주는 화면" 은 앞 단계의 처리가 끝나 있어야 숫자가 찍힌다.
 * 입고 이력 화면은 입고를 해야 한 줄이 생기고, 배정된 개체 표는 예약을 해야 채워진다.
 * 발표자가 그 처리를 매번 손으로 하지 않아도 화면이 채워져 있도록, 각 스텝이 필요한
 * 상태를 이 이름으로 선언하고 가이드가 스토어 액션으로 맞춰 준다.
 *
 * 배열 순서가 곧 진행 순서다.
 */
export type DemoStage =
  /** 시드 그대로 — 제품 · 주문 화면의 기준 숫자를 보여주는 자리 */
  | 'SEED'
  /** 주문의 부족분이 발주 문서로 만들어져 있다 */
  | 'ISSUED'
  /** 생산의뢰가 검사를 거쳐 합격분까지 입고되어 있다 */
  | 'PRODUCTION_RECEIVED'
  /** 구매발주까지 입고되어 주문이 바로 준비 가능으로 풀려 있다 */
  | 'PURCHASE_RECEIVED'
  /** 예약이 끝나 개체가 배정되어 있다 */
  | 'RESERVED'
  /** 출고까지 끝나 현재고와 예약수량이 함께 줄어 있다 */
  | 'SHIPPED'

const STAGE_ORDER: DemoStage[] = [
  'SEED',
  'ISSUED',
  'PRODUCTION_RECEIVED',
  'PURCHASE_RECEIVED',
  'RESERVED',
  'SHIPPED',
]

/** 독에 "가이드가 대신 처리했습니다 — ○○" 로 적을 이름 */
export const DEMO_STAGE_LABEL: Record<DemoStage, string> = {
  SEED: '시드 상태로 되돌림',
  ISSUED: '부족분 발주 생성',
  PRODUCTION_RECEIVED: '생산의뢰 검사 · 입고',
  PURCHASE_RECEIVED: '구매발주 입고',
  RESERVED: '예약 · 개체 배정',
  SHIPPED: '출고',
}

const rank = (stage: DemoStage): number => STAGE_ORDER.indexOf(stage)

const findDocument = (state: ErpDatabase, documentId: DocumentId) =>
  state.incomingDocuments.find((document) => document.documentId === documentId)

/**
 * 지금 상태가 어느 단계인가.
 *
 * 어디까지 실행했는지를 따로 들고 있지 않고 매번 스토어에서 읽는다. 발표자가 손으로
 * 먼저 처리했거나 `데이터 초기화` 를 눌렀을 때, 저장해 둔 진행값은 실제 재고와 어긋나
 * 이미 된 처리를 다시 하거나 필요한 처리를 건너뛴다.
 */
export const currentDemoStage = (state: ErpDatabase): DemoStage => {
  const order = state.orders.find((candidate) => candidate.orderId === DEMO_ORDER)
  if (order?.status === '출고 완료' || order?.status === '배송 완료') return 'SHIPPED'

  if (state.reservations.some((reservation) => reservation.orderId === DEMO_ORDER)) {
    return 'RESERVED'
  }

  const purchase = findDocument(state, DEMO_PURCHASE)
  if (purchase && purchase.receivedQuantity >= purchase.plannedQuantity) return 'PURCHASE_RECEIVED'

  const production = findDocument(state, DEMO_PRODUCTION)
  if (production && production.receivedQuantity > 0) return 'PRODUCTION_RECEIVED'

  if (state.incomingDocuments.some((document) => document.relatedOrderId === DEMO_ORDER)) {
    return 'ISSUED'
  }

  return 'SEED'
}

/**
 * 문서 하나를 잔여수량 전량으로 입고한다.
 *
 * 요청 ID 를 문서번호로 고정한다. 같은 스텝을 두 번 지나도 두 번 입고되지 않아야 하고,
 * 화면의 입고 버튼이 쓰는 토큰과 겹치지 않아야 한다.
 */
const receiveAll = (documentId: DocumentId) => {
  const state = useErpStore.getState()
  const document = findDocument(state, documentId)
  if (!document) return

  const remaining = document.plannedQuantity - document.receivedQuantity
  if (remaining <= 0) return

  state.receive(documentId, remaining, `GUIDE:RECEIVE:${documentId}`)
}

/**
 * 단계별 처리. 화면의 버튼이 부르는 것과 같은 스토어 액션만 쓴다 —
 * 시연용 우회로를 따로 두면 화면에서 본 숫자와 규칙이 갈린다.
 */
const COMMANDS: { stage: DemoStage; run: () => void }[] = [
  {
    stage: 'ISSUED',
    run: () => {
      const state = useErpStore.getState()
      // 주문 상세의 `부족분 발주 생성` 과 같은 계산이다 — 품목 × 창고로 합산된 부족분
      const lines = calculateShortage(planPreparation(state)).filter((line) =>
        line.orderIds.includes(DEMO_ORDER),
      )
      if (lines.length > 0) state.issueIncoming(lines, `GUIDE:ISSUE:${DEMO_ORDER}`)
    },
  },
  {
    // 생산품은 검사를 기록해야 입고로 갈 수 있다. 결과를 넘기지 않으면 전량 합격이다.
    stage: 'PRODUCTION_RECEIVED',
    run: () => useErpStore.getState().inspect(DEMO_PRODUCTION),
  },
  { stage: 'PRODUCTION_RECEIVED', run: () => receiveAll(DEMO_PRODUCTION) },
  { stage: 'PURCHASE_RECEIVED', run: () => receiveAll(DEMO_PURCHASE) },
  {
    // 가이드가 방금 만든 발주도 입고한다 — 입고 이력에 세 건이 남아야 앞 화면의 설명과 맞는다
    stage: 'PURCHASE_RECEIVED',
    run: () => {
      useErpStore
        .getState()
        .incomingDocuments.filter((document) => document.relatedOrderId === DEMO_ORDER)
        .forEach((document) => receiveAll(document.documentId))
    },
  },
  { stage: 'RESERVED', run: () => useErpStore.getState().reserve(DEMO_ORDER) },
  { stage: 'SHIPPED', run: () => useErpStore.getState().ship(DEMO_ORDER) },
]

/**
 * 목표 단계까지 실행되어야 하는 단계들. 실행하지 않고 목록만 돌려준다.
 *
 * 오버레이가 이것으로 두 가지를 판단한다 — 지금 스텝에서 화면이 바뀌는지(바뀌지 않으면
 * 클릭 애니메이션을 띄우지 않는다), 그리고 독에 무엇을 처리했다고 적을지.
 */
export const pendingDemoStages = (target: DemoStage): DemoStage[] => {
  const current = currentDemoStage(useErpStore.getState())
  if (current === target) return []

  // 뒤로 돌아온 자리라면 시드로 되돌린 뒤 목표까지 다시 실행한다
  const from = rank(current) > rank(target) ? 0 : rank(current) + 1
  return STAGE_ORDER.slice(from, rank(target) + 1)
}

/**
 * 목표 단계까지 상태를 맞춘다.
 *
 * 앞으로 가는 것만으로는 부족하다. 발표자가 슬라이드를 되돌리면(출고까지 끝낸 뒤 다시
 * 부족 판정 화면으로) 앞으로 실행할 것이 없고, 출고 완료된 주문은 준비 대상에서 빠져
 * 화면이 비어 버린다. 그래서 목표가 지금보다 앞이면 시드로 되돌린 뒤 다시 실행한다 —
 * 리허설에서 몇 번을 오가도 같은 화면이 나와야 한다.
 */
export const applyDemoStage = (target: DemoStage): DemoStage[] => {
  const applied = pendingDemoStages(target)
  if (applied.length === 0) return []

  /*
   * 시작 지점을 한 번만 정한다. 명령마다 현재 단계를 다시 읽으면, 한 단계에 명령이 둘
   * 이상인 자리(검사 + 입고, 문서 두 건 입고)에서 첫 명령이 그 단계를 이미 만족시켜
   * 나머지가 건너뛰어진다.
   */
  if (applied[0] === 'SEED') useErpStore.getState().reset()
  const from = applied[0] === 'SEED' ? 0 : rank(currentDemoStage(useErpStore.getState()))

  for (const command of COMMANDS) {
    const stage = rank(command.stage)
    if (stage <= from || stage > rank(target)) continue
    command.run()
  }

  return applied
}
