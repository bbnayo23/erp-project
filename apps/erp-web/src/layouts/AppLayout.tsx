import { Outlet } from 'react-router-dom'
import styled from 'styled-components'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`

const Main = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`

const Content = styled.main`
  flex: 1;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin-inline: auto;
  padding: ${({ theme }) => theme.spacing[6]};

  ${({ theme }) => theme.media.maxMd} {
    padding: ${({ theme }) => theme.spacing[4]};
  }
`

export function AppLayout() {
  return (
    <Shell>
      <Sidebar />
      <Main>
        <Header />
        <Content>
          <Outlet />
        </Content>
      </Main>
    </Shell>
  )
}
