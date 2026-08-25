import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

async function bootstrap() {
  // MSW 워커가 준비되기 전에 렌더하면 첫 요청이 그대로 네트워크로 나간다
  if (import.meta.env.VITE_ENABLE_MSW === 'true') {
    const { startMockServer } = await import('./mocks/browser')
    await startMockServer()
  }

  const container = document.getElementById('root')
  if (!container) throw new Error('#root 엘리먼트를 찾을 수 없습니다.')

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
