import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { DocumentId, ErpDatabase, OrderId, Quantity } from '@/types'
import {
  SEED_BASE_AT,
  SEED_BUNDLE_COMPONENTS,
  SEED_INCOMING_DOCUMENTS,
  SEED_INVENTORIES,
  SEED_ITEMS,
  SEED_ORDER_ROWS,
  SEED_SERIALS,
  SEED_SUPPLIERS,
  SEED_WAREHOUSES,
} from '@/data/seed'
import { incomingRepository } from '@/data/repositories/incomingRepository'
import { orderRepository } from '@/data/repositories/orderRepository'
import { serialRepository } from '@/data/repositories/serialRepository'
import { groupOrderRows } from '@/domain/order/groupOrderRows'
import { findItem, isSerialManaged } from '@/domain/master/itemRules'
import { findPlanEntry, planPreparation } from '@/domain/preparation/planPreparation'
import { recordMovements } from '@/domain/inventory/recordMovements'
import { releaseOrder } from '@/domain/inventory/releaseOrder'
import { reserveOrder, type ReserveFailure } from '@/domain/inventory/reserveOrder'
import { shipOrder, type ShipFailure } from '@/domain/inventory/shipOrder'
import {
  completeInspection,
  receiveIncoming,
  type ReceiveFailure,
} from '@/domain/purchase/receiveIncoming'
import { issueIncomingDocuments } from '@/domain/purchase/issueIncomingDocuments'
import type { ShortageLine } from '@/domain/purchase/calculateShortage'

/**
 * 초기 데이터베이스 — 엑셀 8개 시트를 그대로 옮긴 시드.
 *
 * 06_주문만 변환을 거친다. 시트는 주문 하나를 품목별 여러 행으로 갖고 있어
 * groupOrderRows 로 한 번 접는다. 나머지는 시트와 1:1 이다.
 *
 * 예약·출고 이력·처리 이력은 앱이 만드는 것이라 빈 배열로 시작한다.
 */
export const createInitialDatabase = (): ErpDatabase => ({
  items: SEED_ITEMS,
  bundleComponents: SEED_BUNDLE_COMPONENTS,
  warehouses: SEED_WAREHOUSES,
  inventories: SEED_INVENTORIES,
  serials: SEED_SERIALS,
  orders: groupOrderRows(SEED_ORDER_ROWS),
  incomingDocuments: SEED_INCOMING_DOCUMENTS,
  suppliers: SEED_SUPPLIERS,
  reservations: [],
  shipments: [],
  stockMovements: [],
  processedRequests: [],
  baseAt: SEED_BASE_AT,
})

export type ActionFailureCode =
  | ReserveFailure
  | ShipFailure
  | ReceiveFailure
  | 'ORDER_NOT_FOUND'
  | 'DOCUMENT_NOT_FOUND'
  | 'ITEM_NOT_FOUND'
  /** 발주할 수 있는 부족분이 하나도 없었다 — 사유는 rejections 에 있다 */
  | 'NOTHING_TO_ISSUE'
  /** 검사 대기 상태가 아니어서 통과시킬 것이 없다 */
  | 'NOT_PENDING_INSPECTION'

/**
 * 액션 결과.
 *
 * 실패 코드만 돌려주고 문구는 담지 않는다. 한글 문구는 features 계층이 매핑한다 —
 * 스토어가 문구를 들면 같은 판정이 두 곳에 흩어진다.
 */
export interface ActionOutcome {
  ok: boolean
  code?: ActionFailureCode
}

const failed = (code: ActionFailureCode): ActionOutcome => ({ ok: false, code })
const succeeded: ActionOutcome = { ok: true }

export interface ErpActions {
  /** 시드 상태로 되돌린다 */
  reset: () => void

  reserve: (orderId: OrderId) => ActionOutcome
  release: (orderId: OrderId) => ActionOutcome
  ship: (orderId: OrderId) => ActionOutcome

  /**
   * 부족분을 발주·생산의뢰로 만든다.
   * `requestId` 를 호출부가 넘기는 이유: 같은 부족분 목록으로 두 번 눌러도 문서가
   * 한 번만 만들어져야 한다. 예약·출고처럼 주문번호로 유도할 수 없어 화면이 정해야 한다.
   */
  issueIncoming: (lines: readonly ShortageLine[], requestId: string) => ActionOutcome

  receive: (documentId: DocumentId, quantity: Quantity, requestId: string) => ActionOutcome
  inspect: (documentId: DocumentId) => ActionOutcome
}

export type ErpStore = ErpDatabase & ErpActions

/**
 * 인메모리 ERP 스토어.
 *
 * 이 프로젝트에는 백엔드가 없다. 그래서 액션 하나가 트랜잭션 경계다 —
 * 도메인 함수가 돌려준 컬렉션들을 `set()` 한 번에 통째로 대입한다. 재고와 개체를
 * 따로 두 번 대입하면 그 사이에 렌더가 끼어 04_재고현황과 05_개체재고가 어긋난
 * 중간 상태가 화면에 보인다.
 *
 * rollback 은 도메인 함수 쪽에 있다. 실패하면 입력을 그대로 돌려주므로 여기서
 * 분기 없이 대입해도 아무것도 바뀌지 않는다.
 *
 * 모든 액션은 `get()` 으로 현재 상태를 다시 읽는다. 화면이 보고 있던 재고를 믿지
 * 않는다는 뜻이다 (가이드 §11) — 목록을 띄워둔 사이 다른 주문이 예약을 잡았을 수 있다.
 *
 * 시각은 `baseAt` 을 쓴다. 04_재고현황의 기준시각이 이 데이터의 '오늘' 이므로,
 * 실제 시계를 섞으면 납기 계산과 이력의 시간축이 어긋난다.
 */
/** localStorage 키. 값 모양이 바뀌면 STORAGE_VERSION 을 올려 옛 저장분을 버린다. */
const STORAGE_KEY = 'erp-project/state'
const STORAGE_VERSION = 1

/**
 * 브라우저 밖에서 도는 메모리 저장소.
 *
 * 도메인·스토어 테스트는 node 환경에서 돌아 localStorage 가 없다. 그대로 두면 persist 가
 * 매 액션마다 경고를 찍는데, 저장이 실패한 것이 아니라 저장할 곳이 없는 것이므로
 * 경고가 아니라 대체가 맞다.
 */
const memoryStorage = ((): StateStorage => {
  const values = new Map<string, string>()
  return {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => {
      values.set(name, value)
    },
    removeItem: (name) => {
      values.delete(name)
    },
  }
})()

const stateStorage = (): StateStorage =>
  typeof localStorage === 'undefined' ? memoryStorage : localStorage

/**
 * 저장할 것만 고른다.
 *
 * 01_품목 · 02_세트구성 · 03_창고 · 08_공급처와 기준시각은 시드에서 다시 읽는다. 앱이
 * 바꾸지 않는 값이므로 저장해 두면 시드를 고쳐도 옛 사본이 살아남아 화면과 엑셀이
 * 어긋난다. 담당자의 처리 결과가 남아 있는 컬렉션만 저장한다.
 */
const persistedSlice = (state: ErpStore) => ({
  inventories: state.inventories,
  serials: state.serials,
  orders: state.orders,
  incomingDocuments: state.incomingDocuments,
  reservations: state.reservations,
  shipments: state.shipments,
  stockMovements: state.stockMovements,
  processedRequests: state.processedRequests,
})

export const useErpStore = create<ErpStore>()(
  persist<ErpStore, [], [], ReturnType<typeof persistedSlice>>(
    (set, get) => ({
      ...createInitialDatabase(),

      // 시드 상태도 그대로 저장된다 — 저장분을 지우기만 하면 옛 상태가 남아 되살아난다
      reset: () => set(createInitialDatabase()),

      reserve: (orderId) => {
        const state = get()
        const order = orderRepository.find(state.orders, orderId)
        if (!order) return failed('ORDER_NOT_FOUND')

        // 화면이 들고 있던 판정을 쓰지 않고 지금 상태로 전체를 다시 계획한다.
        // 이 주문만 단독으로 판정하면 배송일이 앞선 주문의 몫까지 쓸 수 있다고 보게 된다.
        const entry = findPlanEntry(planPreparation(state), orderId)
        if (!entry) return failed('ORDER_NOT_FOUND')

        const result = reserveOrder(state, {
          order,
          preparation: entry.preparation,
          // 한 주문의 예약은 한 번이다 — 주문번호가 그대로 멱등성 키가 된다
          requestId: `RESERVE:${orderId}`,
          reservedAt: state.baseAt,
        })
        if (!result.ok) return failed(result.failure as ActionFailureCode)

        set({
          inventories: result.inventories,
          serials: result.serials,
          reservations: result.reservations,
          processedRequests: result.processedRequests,
          stockMovements: [
            ...state.stockMovements,
            ...recordMovements(state.inventories, result.inventories, {
              kind: 'RESERVE',
              requestId: `RESERVE:${orderId}`,
              occurredAt: state.baseAt,
              orderId,
            }),
          ],
        })
        return succeeded
      },

      release: (orderId) => {
        const state = get()
        const result = releaseOrder(state, orderId)
        if (!result.ok) return failed(result.failure as ActionFailureCode)

        // 예약 기록을 지우면서 해제하므로 요청 ID 가 없어도 두 번 빠지지 않는다
        set({
          inventories: result.inventories,
          serials: result.serials,
          reservations: result.reservations,
          stockMovements: [
            ...state.stockMovements,
            ...recordMovements(state.inventories, result.inventories, {
              kind: 'RELEASE',
              requestId: `RELEASE:${orderId}`,
              occurredAt: state.baseAt,
              orderId,
            }),
          ],
        })
        return succeeded
      },

      ship: (orderId) => {
        const state = get()
        const order = orderRepository.find(state.orders, orderId)
        if (!order) return failed('ORDER_NOT_FOUND')

        const result = shipOrder(state, {
          order,
          requestId: `SHIP:${orderId}`,
          shippedAt: state.baseAt,
        })
        if (!result.ok) return failed(result.failure as ActionFailureCode)

        set({
          inventories: result.inventories,
          serials: result.serials,
          reservations: result.reservations,
          orders: result.orders,
          shipments: result.shipments,
          processedRequests: result.processedRequests,
          stockMovements: [
            ...state.stockMovements,
            ...recordMovements(state.inventories, result.inventories, {
              kind: 'SHIP',
              requestId: `SHIP:${orderId}`,
              occurredAt: state.baseAt,
              orderId,
            }),
          ],
        })
        return succeeded
      },

      issueIncoming: (lines, requestId) => {
        const state = get()

        // 이 호출 안에서 이미 발급한 번호도 후보에서 빼야 한다. 같은 품목이 창고만
        // 달라도 기준 번호가 같아 두 문서가 같은 번호를 받는다.
        const issuedIds: { documentId: DocumentId }[] = []

        const result = issueIncomingDocuments(state, {
          lines,
          requestId,
          orderedAt: state.baseAt,
          makeDocumentId: (line, documentType) => {
            const documentId = incomingRepository.nextDocumentId(
              [...state.incomingDocuments, ...issuedIds],
              documentType,
              line.itemCode,
              state.baseAt,
            )
            issuedIds.push({ documentId })
            return documentId
          },
        })

        if (!result.ok) return failed(result.failure ?? 'NOTHING_TO_ISSUE')

        set({
          incomingDocuments: result.incomingDocuments,
          processedRequests: result.processedRequests,
        })
        return succeeded
      },

      receive: (documentId, quantity, requestId) => {
        const state = get()

        const document = incomingRepository.find(state.incomingDocuments, documentId)
        if (!document) return failed('DOCUMENT_NOT_FOUND')

        const item = findItem(state.items, document.itemCode)
        if (!item) return failed('ITEM_NOT_FOUND')

        // 개체번호는 스토어가 만든다. 도메인 함수는 순수해야 하므로 번호를 지어내지 않는다.
        const serialNumbers = isSerialManaged(item)
          ? serialRepository.nextSerialNumbers(state.serials, item.itemCode, quantity)
          : undefined

        const result = receiveIncoming(state, {
          document,
          item,
          quantity,
          requestId,
          receivedAt: state.baseAt,
          ...(serialNumbers ? { serialNumbers } : {}),
        })
        if (!result.ok) return failed(result.failure as ActionFailureCode)

        set({
          inventories: result.inventories,
          serials: result.serials,
          incomingDocuments: incomingRepository.replace(state.incomingDocuments, result.document),
          processedRequests: result.processedRequests,
          stockMovements: [
            ...state.stockMovements,
            ...recordMovements(state.inventories, result.inventories, {
              kind: 'RECEIVE',
              requestId,
              occurredAt: state.baseAt,
              documentId,
              // 부족분 발주에서 나온 문서라면 어느 주문을 풀어준 입고인지 이력에서 바로 보여야 한다
              ...(document.relatedOrderId ? { orderId: document.relatedOrderId } : {}),
            }),
          ],
        })
        return succeeded
      },

      inspect: (documentId) => {
        const state = get()

        const document = incomingRepository.find(state.incomingDocuments, documentId)
        if (!document) return failed('DOCUMENT_NOT_FOUND')

        const inspected = completeInspection(document)
        // completeInspection 은 대기 상태가 아니면 같은 객체를 돌려준다
        if (inspected === document) return failed('NOT_PENDING_INSPECTION')

        set({ incomingDocuments: incomingRepository.replace(state.incomingDocuments, inspected) })
        return succeeded
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(stateStorage),
      partialize: persistedSlice,
    },
  ),
)
