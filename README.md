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

## 현재 진행 상태

타입 · 시드 · 도메인 계층까지 구현되어 있다. 화면(`pages/`, `features/`)과 스토어(`store/`)는
다음 단계이며, 지금은 라우트가 `pages/PlaceholderPage` 한 장을 가리킨다.
아래 구조에서 `features/` 와 `store/` 는 들어올 자리를 표시한 것이다.

## 구조

```
src/
├── types/          엑셀 시트별 엔티티 타입 (단일 출처, 선언만)
├── app/            앱 진입 · 라우팅 · 전역 프로바이더
├── pages/          라우트가 가리키는 화면. 화면당 폴더 하나
├── components/     화면에 종속되지 않는 UI (common) 와 앱 셸 (layout)
├── features/       업무 단위 묶음 — 컴포넌트 · 훅 · 화면용 타입 · 표시용 유틸
├── domain/         순수 비즈니스 규칙 (React·스토어를 모른다)
├── data/           시드 데이터 (seed) 와 컬렉션 접근 계층 (repositories)
├── store/          zustand 스토어 — 도메인 함수를 조립해 상태를 옮긴다
├── styles/         토큰 · 시맨틱 테마 · 전역 스타일
└── utils/          날짜 · 숫자 원시 함수
```

의존 방향은 한쪽으로만 흐른다.

```
app → pages → features → { components, store } → { domain, data } → types
                                                        ↓
                                                      utils
```

`types/` 는 아무것도 import 하지 않는 잎이고, `domain/` 은 어떤 상위 계층도 모른다.
순수 함수라서 브라우저 없이 실행·검증할 수 있다.

`types/` 는 선언만 담는다. 규칙(가용재고 계산, 창고 사용 여부, 입고 잔여수량)은 전부
`domain/` 에 둔다 — 같은 지식이 두 곳에 흩어지면 한쪽만 고치는 일이 생긴다.

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

## 데이터

`재고흐름ERP과제_example-data_실무형_v2.xlsx` 의 8개 시트를 `data/seed/` 로 옮겼다.
파일 하나가 시트 하나와 1:1 이라 엑셀을 다시 내보내도 같은 자리에 대응된다.

엑셀 원본에서 손댄 것은 두 가지뿐이다.

- **날짜** — 엑셀 float 오차로 생긴 `.999999` / `.000001` 꼬리를 초 단위로 반올림하고
  기준 타임존(Asia/Seoul)을 명시했다. `15:59:59.999999` → `16:00:00+09:00`
- **예/아니오** — 시리얼관리여부·출고대상여부·확정여부만 boolean 으로 바꿨다.
  나머지 한글 상태값(주문상태·개체상태·진행상태 등)은 화면에 그대로 노출되므로 유지한다.

기준시각은 `SEED_BASE_AT = 2026-07-21T09:00:00+09:00` 이다. 04_재고현황의 모든 행이 이
시각 기준이고, 준비 판정과 납기 계산의 '오늘' 이다.

`04_재고현황`과 `05_개체재고`는 서로 정합한다. 시리얼 관리 품목은 창고에 남아 있는
개체 수(`창고 보관 중` + `주문 배정됨`)가 현재고이고, `주문 배정됨` 개체 수가 예약수량이다.
`출고 완료` 개체는 창고를 떠났으므로 어느 쪽에도 세지 않는다.

## 업무 규칙

`00_안내` 시트의 규칙 8개가 그대로 도메인 함수가 된다.

| 규칙                                           | 구현                                         |
| ---------------------------------------------- | -------------------------------------------- |
| 가용재고 = 현재고 - 예약수량                   | `domain/inventory/getAvailableQuantity.ts`   |
| 주문 확정 상태의 정상 품목만 준비 대상         | `evaluateOrder` / `isPreparationTarget`      |
| 세트는 구성품으로 풀고 서비스는 수요에서 제외  | `domain/order/expandBundle.ts`               |
| 입고예정·검사 대기 수량은 아직 현재고가 아니다 | `domain/purchase/getRemainingQuantity.ts`    |
| 부분 입고분은 이미 현재고, 잔여 = 계획 - 입고  | `getRemainingQuantity`                       |
| 한 주문은 전량 준비 가능할 때만 예약한다       | `domain/inventory/reserveOrder.ts`           |
| 발주를 만든 것만으로 현재고는 늘지 않는다      | `createIncomingDocument` / `receiveIncoming` |
| 반복 처리에도 재고가 중복 반영되면 안 된다     | `Reservation` 기록 + 각 함수의 실패 코드     |

### 업무 흐름

```
Order
  ↓ groupOrderRows      06_주문 37행 → 주문 29건
  ↓ expandBundle        세트 → 실물 품목, 서비스 제외
  ↓ calculateDemand     정상 품목만, 수량 0 이하는 오류로 분리
  ↓ evaluateOrder       READY / WAITING / SHORTAGE / INVALID
  ↓ reserveOrder        READY 만. 개체는 FIFO 로 배정
  ↓ shipOrder           현재고·예약 동시 차감, 개체 → 출고 완료
```

부족하면 발주로 돌아간다.

```
evaluateOrder
  ↓ calculateShortage           품목 × 창고로 소요 합산
  ↓ createIncomingDocument      생산품 → MO, 매입품 → PO
  ↓ receiveIncoming             검사 통과 후 현재고 증가
  ↓ evaluateOrder               WAITING → READY
```

### 준비상태는 주문상태와 다른 축이다

주문상태는 영업 진행 단계이고, 준비상태는 "지금 이 주문을 내보낼 수 있는가" 다.

```
주문상태 = 주문 확정   준비상태 = WAITING   대기원인 = QUALITY_INSPECTION
```

세 값이 동시에 성립한다. 그래서 `PreparationStatus` 는 `OrderStatus` 와 별도 타입이다.

### 부족분은 주문별로 더하지 않는다

가용재고 1개를 두 주문이 각각 1개씩 필요로 하면 주문별 부족은 `0 + 0` 이지만 실제로는
1개가 모자라다. 그래서 `calculateShortage` 는 품목 × 창고 단위로 소요량을 먼저 합치고
가용재고와 입고예정은 한 번만 뺀다.

### 예약은 주문별로 추적한다

`04_재고현황` 의 `기존예약주문번호` 는 주문을 한 건만 적고 있어 누적 예약을 주문별로
나눌 수 없다. 그 상태로는 두 가지가 깨진다.

- 한 주문을 취소할 때 같은 품목을 예약한 다른 주문의 재고까지 풀린다.
- 같은 주문을 두 번 처리하면 재고가 중복 차감된다.

그래서 앱이 만드는 예약은 `Reservation` 엔티티로 기록한다. 이 기록이 곧 멱등성 판정
근거다 — 같은 주문의 예약이 이미 있으면 `ALREADY_RESERVED` 로 되돌린다.
시트에 없는 확장 엔티티이며, `IncomingDocument.relatedOrderId` 와 같은 성격이다.
