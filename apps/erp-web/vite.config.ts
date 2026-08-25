import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolvePath('./src'),
      // 디자인시스템은 소스로 직접 연결한다 → 수정 즉시 HMR (빌드 단계 불필요)
      '@erp/design-system': resolvePath('../../packages/design-system/src'),
    },
    // styled-components 인스턴스가 두 개 생기면 테마 컨텍스트가 끊긴다
    dedupe: ['react', 'react-dom', 'styled-components'],
  },
  server: {
    port: 5173,
    open: true,
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
