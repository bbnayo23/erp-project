/**
 * 08_공급처 (6행).
 *
 * 구매처는 발주(PO), 생산처는 생산의뢰(MO) 대상이다.
 */

import type { Supplier } from '@/types'

export const SEED_SUPPLIERS: Supplier[] = [
  {
    supplierCode: 'SUP-FOAM',
    supplierName: '폼텍소재',
    type: '구매처',
    leadTimeDays: 3,
  },
  {
    supplierCode: 'SUP-FRAME',
    supplierName: '우드프레임',
    type: '구매처',
    leadTimeDays: 4,
  },
  {
    supplierCode: 'SUP-TEX',
    supplierName: '텍스타일코리아',
    type: '구매처',
    leadTimeDays: 2,
  },
  {
    supplierCode: 'SUP-PILLOW',
    supplierName: '슬립하우스',
    type: '구매처',
    leadTimeDays: 2,
  },
  {
    supplierCode: 'FAC-01',
    supplierName: '1공장',
    type: '생산처',
    leadTimeDays: 3,
  },
  {
    supplierCode: 'FAC-02',
    supplierName: '2공장',
    type: '생산처',
    leadTimeDays: 5,
  },
]
