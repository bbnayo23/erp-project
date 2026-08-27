/**
 * 표 컬럼 폭.
 *
 * 같은 성격의 칸은 화면이 달라도 같은 폭이어야 한다. 재고 현황의 '현재고' 와 주문
 * 상세의 '필요' 는 둘 다 세 자리 수량인데 80px · 70px · 90px 로 제각각이었다.
 * 담당자는 세 화면을 오가며 같은 표를 본다고 느껴야 하고, 폭이 흔들리면 숫자를
 * 다시 읽게 된다.
 *
 * 값은 본문 12px 기준이다. 폰트 스케일을 바꾸면 여기도 같이 봐야 한다.
 */
export const COLUMN_WIDTH = {
  /** 순번 · 우선순위 — 두 자리 */
  sequence: '56px',
  /** 수량 — 네 자리까지 */
  quantity: '72px',
  /** 헤더가 긴 수량 칸 ('입고 후 현재고' 처럼) */
  quantityWide: '104px',

  /** 날짜 한 줄 (2026.07.22) */
  date: '104px',
  /** 날짜 + 아래 보조 문구 (2026.07.22 / 1일 남음) */
  dateNote: '132px',
  /** 시각 (2026.07.21 09:00) */
  dateTime: '140px',

  /** 상태 배지 한 줄 */
  status: '120px',
  /** 상태 배지 + 아래 설명 한 줄 */
  statusNote: '200px',

  /** 창고명 */
  warehouse: '128px',
  /** 주문번호 (ORD202607200016) */
  orderId: '176px',
  /** 문서번호 (PO-20260721-PIL) */
  documentId: '200px',
  /** 시리얼번호 (UNIT-Z10-Q-0001) */
  serial: '180px',
  /** 보관위치 (A-01-01) */
  location: '104px',

  /** 처리 버튼 — 수량 입력 + 버튼이 한 줄에 들어가야 한다 */
  action: '190px',
} as const

export type ColumnWidthKey = keyof typeof COLUMN_WIDTH
