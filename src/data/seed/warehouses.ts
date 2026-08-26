/**
 * 03_창고 (4행).
 *
 * WH-LEGACY 는 사용 중지 창고다. 재고와 개체가 남아 있지만 출고 준비 대상이 아니다.
 */

import type { Warehouse } from '@/types'

export const SEED_WAREHOUSES: Warehouse[] = [
  {
    warehouseCode: 'WH-HQ',
    warehouseName: '본사물류창고',
    status: '사용 중',
  },
  {
    warehouseCode: 'WH-08',
    warehouseName: '8창고',
    status: '사용 중',
  },
  {
    warehouseCode: 'WH-CJ',
    warehouseName: '청주물류창고',
    status: '사용 중',
  },
  {
    warehouseCode: 'WH-LEGACY',
    warehouseName: '구창고(비활성)',
    status: '사용 중지',
  },
]
