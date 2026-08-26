import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolvePath('./src'),
    },
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
  // 기본은 node 다. 도메인 계층은 순수 함수라 브라우저가 필요 없고, 화면 테스트만
  // 파일 상단의 `@vitest-environment jsdom` 으로 올린다 — 전부 jsdom 으로 돌리면
  // 도메인 테스트가 느려진다.
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.{ts,tsx}'],
    setupFiles: ['src/tests/setup.ts'],
  },
})
