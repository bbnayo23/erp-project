import type { ReactNode } from 'react'

export interface TourTargetProps {
  /** 발표 가이드가 이 값으로 대상을 찾는다 — `[data-tour="값"]` */
  tour: string
  children: ReactNode
}

/**
 * 발표 가이드가 하이라이트할 자리를 표시하는 얇은 박스.
 *
 * Panel · PageHeader · SummaryCards · DataTable 같은 공통 컴포넌트는 `data-tour` 를
 * 전달받지 않는다. 공통 컴포넌트에 안내 전용 props 를 뚫는 대신, 페이지가 소유하는
 * 이 박스로 한 겹 감싼다 — 페이지 자체의 styled 요소라면 이 컴포넌트 없이 `data-tour`
 * 를 바로 붙이는 편이 낫다.
 */
export const TourTarget = ({ tour, children }: TourTargetProps) => {
  return <div data-tour={tour}>{children}</div>
}
