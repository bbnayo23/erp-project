import { Outlet } from 'react-router-dom'
import { GNB } from '@/components/layout/GNB'
import { Content, Shell } from './styled'

export function AppLayout() {
  return (
    <Shell>
      <GNB />
      <Content>
        <Outlet />
      </Content>
    </Shell>
  )
}
