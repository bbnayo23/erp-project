import { Panel } from '@/components/common/Panel'
import { PageHeader } from '@/components/layout/PageHeader'
import { List } from './styled'

/**
 * 화면 구현 전 임시 페이지.
 *
 * 타입·시드·도메인 계층까지 먼저 확정하는 단계라 라우트는 이 한 장만 가리킨다.
 * 재고·수주·발주 화면이 붙으면 이 폴더는 사라진다.
 */
export function PlaceholderPage() {
  return (
    <>
      <PageHeader
        title="재고 흐름 ERP"
        description="타입 · 시드 · 도메인 계층까지 구현된 상태입니다. 화면은 다음 단계입니다."
      />
      <Panel>
        <div style={{ padding: 24 }}>
          <List>
            <li>types/ — 엑셀 시트별 엔티티 타입 (+ reservation · preparation · dataset)</li>
            <li>data/seed/ — 엑셀 8개 시트를 그대로 옮긴 시드</li>
            <li>data/repositories/ — 문서번호 · 시리얼번호 생성</li>
            <li>domain/master/ — 품목 · 창고 · 공급처 판정</li>
            <li>domain/order/ — groupOrderRows · expandBundle · calculateDemand · evaluateOrder</li>
            <li>
              domain/inventory/ — getAvailableQuantity · reserveOrder · releaseOrder · shipOrder
            </li>
            <li>domain/purchase/ — calculateShortage · createIncomingDocument · receiveIncoming</li>
          </List>
        </div>
      </Panel>
    </>
  )
}
