import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

/** main.tsx 에서 앱 렌더 전에 await 한다. */
export async function startMockServer() {
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: false,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}
