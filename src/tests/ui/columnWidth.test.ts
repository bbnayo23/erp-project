import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * 표 컬럼 폭은 공용 토큰만 쓴다.
 *
 * 같은 성격의 칸이 화면마다 다른 폭이었다 — 세 자리 수량이 70px · 80px · 90px 로
 * 흩어져 있었다. 담당자는 세 화면을 오가며 같은 표를 본다고 느껴야 하고, 폭이 흔들리면
 * 숫자를 다시 읽게 된다.
 *
 * 눈으로 지킬 수 없는 규칙이라 소스를 직접 본다. 새 컬럼을 추가하며 \`width: '84px'\` 를
 * 적으면 여기서 걸린다.
 */
describe('표 컬럼 폭', () => {
  const PAGES = [
    'src/pages/InventoryPage/InventoryPage.tsx',
    'src/pages/OrderDetailPage/OrderDetailPage.tsx',
    'src/pages/PreparationPage/PreparationPage.tsx',
    'src/pages/PurchasePage/PurchasePage.tsx',
  ]

  it.each(PAGES)('%s 는 폭을 직접 적지 않는다', (path) => {
    const source = readFileSync(path, 'utf8')
    const hardcoded = [...source.matchAll(/width: '(\d+)px'/g)].map((match) => match[0])

    expect(hardcoded).toEqual([])
  })

  it('네 화면이 모두 공용 토큰을 쓴다', () => {
    for (const path of PAGES) {
      const source = readFileSync(path, 'utf8')
      expect(source).toContain('COLUMN_WIDTH.')
    }
  })
})
