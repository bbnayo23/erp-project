import { Link } from 'react-router-dom'
import { Panel } from '@/components/common/Panel'
import { PageHeader } from '@/components/layout/PageHeader'
import { List } from './styled'

/**
 * 아직 만들지 않은 화면의 자리.
 *
 * 재고·발주 경로가 이 한 장을 가리킨다. 수주(배송 준비 현황)는 구현되어 있고, 예약·출고·
 * 발주·입고는 모두 그 안의 주문 상세에서 처리한다 — 업무가 주문 단위로 흐르기 때문이다.
 */
export function PlaceholderPage() {
  return (
    <>
      <PageHeader
        title="준비 중인 화면입니다"
        description="지금은 수주 메뉴의 배송 준비 현황에서 전체 흐름을 처리할 수 있습니다."
      />
      <Panel>
        <div style={{ padding: 24 }}>
          <List>
            <li>재고 화면 — 창고별 현재고 · 예약수량 · 가용재고, 개체재고 조회</li>
            <li>발주 화면 — 입고예정 문서 목록, 품질검사와 입고 처리</li>
            <li>
              주문 단위 처리는 <Link to="/orders">배송 준비 현황</Link> 에서 할 수 있습니다
            </li>
          </List>
        </div>
      </Panel>
    </>
  )
}
