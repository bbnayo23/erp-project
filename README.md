# erp-project

지큐브스페이스 ERP 자동화 솔루션 과제.

재고 · 수주 · 발주 세 업무를 하나의 인메모리 도메인 모델로 잇는 프론트엔드 단일 프로젝트다.
백엔드 없이 동작하며, 상태는 `store/erpStore.ts` 한 곳에 모인다.

## 실행

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm typecheck
pnpm lint
pnpm build
```

## 구조

```
src/
├── app/            앱 진입 · 라우팅 · 전역 프로바이더
├── pages/          라우트가 가리키는 화면. 화면당 폴더 하나
├── components/     화면에 종속되지 않는 UI (common) 와 앱 셸 (layout)
├── features/       업무 단위 묶음 — 컴포넌트 · 훅 · 타입 · 표시용 유틸
├── domain/         순수 비즈니스 규칙 (React·스토어를 모른다)
├── data/           시드 데이터 (seed) 와 컬렉션 접근 계층 (repositories)
├── store/          zustand 스토어 — 도메인 함수를 조립해 상태를 옮긴다
├── styles/         토큰 · 시맨틱 테마 · 전역 스타일
└── utils/          날짜 · 숫자 · 멱등성 원시 함수
```

의존 방향은 한쪽으로만 흐른다.

```
app → pages → features → { components, store } → { domain, data } → utils
```

`domain/` 은 어떤 상위 계층도 import 하지 않는다. 순수 함수라서 브라우저 없이 실행·검증할 수 있다.
엔티티 타입은 각 피처의 `types.ts` 가 단일 출처이고, `domain/` 과 `data/` 가 이를 참조한다.

## 파일 규칙

컴포넌트와 페이지는 폴더 하나에 역할별로 파일을 쪼갠다. **폴더명 = 컴포넌트명** 이다.

| 파일         | 담는 것                                             |
| ------------ | --------------------------------------------------- |
| `<Name>.tsx` | 컴포넌트 본체. 마크업과 조립만 한다                 |
| `types.ts`   | props 와 그 컴포넌트가 쓰는 타입                    |
| `styled.ts`  | styled-components. 전달 prop 은 `$` 접두사만 쓴다   |
| `hooks.ts`   | 훅과 함수                                           |
| `index.ts`   | 공개 API. 바깥에서는 항상 폴더 경로로만 import 한다 |

```
components/common/Button/        pages/OrdersPage/
├── index.ts                     ├── index.ts
├── Button.tsx                    ├── OrdersPage.tsx
├── styled.ts                     ├── hooks.ts
└── types.ts                      └── types.ts
```

내용이 없는 파일은 만들지 않는다. 스타일이 없는 컴포넌트에 빈 `styled.ts` 를 두지 않는다.

피처 단위도 같은 이름을 쓴다 — `features/inventory/{types,utils,hooks}.ts`. 폴더가 이미 맥락을
말하므로 `inventory.types.ts` 처럼 접두사를 붙이지 않는다.

`styled.ts` 는 JSX 를 담을 수 없으므로 아이콘은 `components/common/Icon` 한 곳에 모았다.
GNB 의 메뉴 목록처럼 컴포넌트 전용 상수는 `constants.ts` 로 뺀다.

### 페이지는 마크업만 남긴다

각 페이지의 `hooks.ts` 가 로컬 상태·액션·표시용 가공을 모두 처리하고, `types.ts` 가 그 훅의
반환 형태를 고정한다. 페이지 `.tsx` 에는 `useState` 도 계산도 없다.

```tsx
const { rows, filter, setFilter, summaryItems } = useInventoryPage()
```

## 도메인 규칙

핵심 계산은 모두 `domain/` 의 순수 함수에 있다.

| 규칙                                            | 위치                                          |
| ----------------------------------------------- | --------------------------------------------- |
| 가용 재고 = 실물 - 예약                         | `domain/inventory/calculateAvailableStock.ts` |
| 번들 → 실물 품목 재귀 전개 (번들 중첩 허용)     | `domain/order/expandBundle.ts`                |
| 미결 수주의 품목별 소요량 집계                  | `domain/order/calculateDemand.ts`             |
| 가용 범위 내 부분 예약                          | `domain/inventory/reserveInventory.ts`        |
| 예약 결과로 수주 상태 유도                      | `domain/order/evaluateOrderStatus.ts`         |
| 부족분 = 소요량 + 안전재고 - 가용 - 입고예정    | `domain/purchase/calculateShortage.ts`        |
| 공급처별 발주 생성 (입고예정일 = 최장 리드타임) | `domain/purchase/createPurchaseOrder.ts`      |
| 입고 → 실물 재고 증가 (예약 불변)               | `domain/purchase/receivePurchaseOrder.ts`     |

### 예약은 수주별로 추적한다

`InventoryRecord.reserved` 는 창고 합계라서 누구의 예약인지 알 수 없다. 그래서 각 수주가
`Order.allocated` 에 자기 몫을 들고 있다. 이게 없으면 두 가지가 깨진다.

- 한 수주를 취소할 때 같은 품목을 예약한 다른 수주의 재고까지 풀린다.
- 부분예약 수주를 다시 확정할 때 이미 잡은 몫을 또 예약하려 든다.

확정은 `demand - allocated` 잔여분만 예약하므로 반복 호출이 안전하다. 입고 후 다시 확정을
누르면 부족분만 채워진다.

### 멱등성

재고를 실제로 소비하는 액션(취소 · 출하 · 입고 · 발주 생성)은 `utils/idempotency.ts` 의
키 로그로 중복 실행을 막는다. 확정은 위 이유로 반복이 안전하므로 막지 않는다.

## 데이터

`data/seed/` 의 재고는 실물 수량만 담고 `reserved` 는 0 이다. 스토어가 부팅할 때 확정 상태로
시드된 수주를 실제 예약 경로에 흘려보내 예약을 만든다. 시드에 예약 수량을 손으로 적지 않으므로
재고와 수주가 항상 정합한다.
