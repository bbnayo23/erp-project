import type { Employee, Order, OrderLine, Product } from '@/types/domain'

/**
 * 목업 시드 데이터.
 * 실제 API 가 붙으면 이 파일과 handlers.ts 만 지우면 된다 — 나머지 코드는 그대로 동작한다.
 */

const DEPARTMENTS = ['경영지원', '영업', '개발', '생산', '품질관리', '물류']
const POSITIONS = ['사원', '주임', '대리', '과장', '차장', '부장']
const FAMILY = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신']
const GIVEN = [
  '서연',
  '지훈',
  '하늘',
  '민재',
  '수빈',
  '도윤',
  '예린',
  '준서',
  '지아',
  '현우',
  '채원',
  '유진',
  '태호',
  '가은',
  '승민',
  '나윤',
  '건우',
  '소율',
  '진우',
  '다인',
]

const CATEGORIES = ['원자재', '부품', '완제품', '소모품', '포장재']
const UNITS = ['EA', 'BOX', 'KG', 'M', 'SET']
const PRODUCT_WORDS = [
  '알루미늄 프레임',
  '스테인리스 볼트',
  '고무 패킹',
  '베어링 유닛',
  '전원 케이블',
  '제어 모듈',
  '냉각 팬',
  '실리콘 시트',
  '방진 마운트',
  '유압 실린더',
  '센서 브래킷',
  '컨베이어 벨트',
  '리니어 가이드',
  '커플링',
  '토크 리미터',
]

const CUSTOMERS = [
  '(주)대한산업',
  '동양정밀(주)',
  '한빛테크',
  '태성엔지니어링',
  '누리소재',
  '세종메탈',
  '광명전자',
  '유진플랜트',
  '삼도기계',
  '온누리상사',
]

/** 시드 기반 의사난수 — 새로고침해도 같은 데이터가 나오도록 */
function createRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const random = createRandom(20260825)

const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)] as T
const between = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min

function isoDate(daysAgo: number): string {
  const base = new Date('2026-08-25T00:00:00.000Z').getTime()
  return new Date(base - daysAgo * 86_400_000).toISOString().slice(0, 10)
}

export function createEmployees(count = 137): Employee[] {
  return Array.from({ length: count }, (_, index) => {
    const seq = index + 1
    const name = `${pick(FAMILY)}${pick(GIVEN)}`
    const statusRoll = random()
    const status: Employee['status'] =
      statusRoll > 0.93 ? 'resigned' : statusRoll > 0.87 ? 'leave' : 'active'

    return {
      id: `emp-${seq}`,
      code: `EMP-${String(seq).padStart(4, '0')}`,
      name,
      email: `user${seq}@erp-demo.co.kr`,
      phone: `010-${String(between(1000, 9999))}-${String(between(1000, 9999))}`,
      department: pick(DEPARTMENTS),
      position: pick(POSITIONS),
      status,
      hiredAt: isoDate(between(30, 3600)),
      salary: between(32, 96) * 1_000_000,
    }
  })
}

export function createProducts(count = 84): Product[] {
  return Array.from({ length: count }, (_, index) => {
    const seq = index + 1
    const cost = between(1, 240) * 1000
    const stock = between(0, 900)
    const safetyStock = between(20, 120)
    const status: Product['status'] =
      stock === 0 ? 'soldout' : random() > 0.94 ? 'discontinued' : 'selling'

    return {
      id: `prd-${seq}`,
      sku: `SKU-${String(seq).padStart(5, '0')}`,
      name: `${pick(PRODUCT_WORDS)} ${String.fromCharCode(65 + (seq % 26))}${between(10, 99)}`,
      category: pick(CATEGORIES),
      unit: pick(UNITS),
      cost,
      price: Math.round((cost * (1.2 + random() * 0.8)) / 100) * 100,
      stock,
      safetyStock,
      status,
      updatedAt: isoDate(between(0, 120)),
    }
  })
}

export function createOrders(products: Product[], employees: Employee[], count = 96): Order[] {
  const statuses: Order['status'][] = ['draft', 'confirmed', 'shipped', 'done', 'canceled']

  return Array.from({ length: count }, (_, index) => {
    const seq = index + 1
    const orderedDaysAgo = between(0, 180)
    const lineCount = between(1, 4)

    const lines: OrderLine[] = Array.from({ length: lineCount }, () => {
      const product = pick(products)
      const quantity = between(1, 60)
      return {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
      }
    })

    const statusRoll = random()
    const status: Order['status'] =
      statusRoll > 0.96
        ? 'canceled'
        : statusRoll > 0.6
          ? 'done'
          : statusRoll > 0.4
            ? 'shipped'
            : statusRoll > 0.15
              ? 'confirmed'
              : (statuses[0] as Order['status'])

    return {
      id: `ord-${seq}`,
      orderNo: `SO-2026${String(seq).padStart(5, '0')}`,
      customer: pick(CUSTOMERS),
      orderedAt: isoDate(orderedDaysAgo),
      dueAt: isoDate(orderedDaysAgo - between(7, 30)),
      status,
      lines,
      totalAmount: lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
      owner: pick(employees).name,
    }
  })
}
