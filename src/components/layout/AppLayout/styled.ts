import styled from 'styled-components'

export const Shell = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`

export const Content = styled.main`
  flex: 1;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin-inline: auto;
  padding: ${({ theme }) => theme.spacing[6]};

  ${({ theme }) => theme.media.maxMd} {
    padding: ${({ theme }) => theme.spacing[4]};
  }
`
