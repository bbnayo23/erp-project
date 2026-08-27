import { Outlet } from 'react-router-dom'
import { GNB } from '@/components/layout/GNB'
import { Content, Inner, Shell } from './styled'

export function AppLayout() {
  return (
    <Shell>
      <GNB />
      {/* data-app-scroll: 오버레이가 열릴 때 잠글 스크롤 영역 (Overlay/hooks) */}
      <Content data-app-scroll>
        <Inner>
          <Outlet />
        </Inner>
      </Content>
    </Shell>
  )
}
