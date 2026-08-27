import type { ISODateString } from '@/types'

/**
 * 화면이 보여주는 숫자가 **어느 시점의 것인가**.
 *
 * 이 앱의 숫자는 두 겹이다 — 엑셀에서 온 기준시각 스냅샷과, 담당자가 이 화면에서
 * 처리해 그 위에 얹힌 결과. 둘이 섞여 있는데 구분이 없으면 담당자는 지금 보는 재고가
 * 자기 조작을 반영한 것인지 알 수 없다. 재고 화면의 본질은 "믿을 수 있나" 이므로
 * 그 물음에 화면이 먼저 답해야 한다.
 */
export interface DataFreshness {
  /** 04_재고현황 기준시각 — 스냅샷의 '지금' */
  baseAt: ISODateString
  /** 이 화면에서 재고를 움직인 횟수 (예약 · 해제 · 출고 · 입고) */
  changeCount: number
  /** 마지막으로 움직인 처리. 한 번도 없으면 undefined */
  lastChange?: {
    label: string
    /** 무엇이 바뀌었는지 한 줄 */
    detail: string
  }
}

/**
 * 방금 바뀐 자리.
 *
 * 예약·출고·입고 직후, 그 처리가 건드린 행을 잠시 표시한다. 담당자가 자기 조작이
 * **의도한 자리에** 반영됐는지 눈으로 확인할 수 있어야 한다 — 숫자만 바뀌면 어디가
 * 바뀐 것인지 다시 찾아야 한다.
 */
export interface RecentChange {
  /** 품목@창고 */
  key: string
  label: string
}
