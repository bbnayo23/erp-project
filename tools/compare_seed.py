"""엑셀 원본 ↔ data/seed 셀 단위 대조.

시드가 시트와 1:1 이라는 README 의 주장을 기계로 확인한다.
불일치는 시트 · 행 · 컬럼 단위로 찍고, 하나라도 있으면 종료코드 1 로 끝난다.

시드는 .ts 를 직접 읽는다. JSON 으로 한 번 내보낸 뒤 비교하면 그 JSON 이
두 번째 출처가 되어, 정작 앱이 쓰는 값과 어긋나도 대조가 통과할 수 있다.

사용법 (프로젝트 루트에서):
  python tools/dump_xlsx.py "src/재고흐름ERP과제_example-data_실무형_v2.xlsx"   # 시트 확인
  python tools/compare_seed.py "src/재고흐름ERP과제_example-data_실무형_v2.xlsx"
"""

import datetime as dt
import os
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

# 프로젝트 루트에서 `python tools/compare_seed.py ...` 로 부를 수 있게 한다
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 윈도우 콘솔 기본 코드페이지(cp949)는 한글은 되지만 em dash 같은 문자에서 죽는다.
# 대조 결과를 콘솔 설정 때문에 못 보는 일이 없어야 한다.
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import read_seed  # noqa: E402
from dump_xlsx import NS, cell_value, load_date_styles, load_shared_strings, sheets  # noqa: E402

KST = '+09:00'


def read_sheets(path):
    """시트명 -> [dict(헤더 -> 값)]"""
    out = {}
    with zipfile.ZipFile(path) as z:
        shared = load_shared_strings(z)
        date_styles = load_date_styles(z)
        for name, sheet_path in sheets(z):
            root = ET.fromstring(z.read(sheet_path))
            data = root.find('m:sheetData', NS)
            rows = []
            for row in data.findall('m:row', NS):
                cells = {}
                for cell in row.findall('m:c', NS):
                    ref = cell.get('r')
                    if ref is None:
                        continue
                    letters = re.match(r'[A-Z]+', ref).group(0)
                    n = 0
                    for ch in letters:
                        n = n * 26 + (ord(ch) - 64)
                    cells[n - 1] = cell_value(cell, shared, date_styles)
                width = max(cells) + 1 if cells else 0
                rows.append([cells.get(i, '') for i in range(width)])
            out[name] = rows
    return out


def as_records(rows, header_row=0):
    header = rows[header_row]
    records = []
    for row in rows[header_row + 1:]:
        if not any(cell.strip() for cell in row):
            continue
        padded = row + [''] * (len(header) - len(row))
        records.append({key: padded[i].strip() for i, key in enumerate(header) if key})
    return records


def iso_datetime(value):
    """'2026-07-18 15:59:59.999999' -> '2026-07-18T16:00:00+09:00'

    엑셀 float 오차로 생긴 마이크로초 꼬리를 초 단위로 반올림한다 (README '데이터').
    """
    if not value:
        return None
    if len(value) == 10:
        return f'{value}T00:00:00{KST}'
    moment = dt.datetime.strptime(value, '%Y-%m-%d %H:%M:%S.%f' if '.' in value else '%Y-%m-%d %H:%M:%S')
    if moment.microsecond:
        moment += dt.timedelta(seconds=1) if moment.microsecond >= 500_000 else dt.timedelta()
        moment = moment.replace(microsecond=0)
    return moment.strftime('%Y-%m-%dT%H:%M:%S') + KST


def iso_date(value):
    """날짜만 있는 칸 — 자정 기준으로 되돌린다"""
    if not value:
        return None
    return f'{value[:10]}T00:00:00{KST}'


def yes_no(value):
    return value == '예'


def number(value):
    if value == '':
        return None
    return int(float(value))


def blank_to_none(value):
    return value if value else None


class Report:
    def __init__(self):
        self.problems = []
        self.checked = 0

    def compare(self, sheet, key, field, expected, actual):
        self.checked += 1
        if expected != actual:
            self.problems.append(f'{sheet} [{key}] {field}: 엑셀={expected!r} 시드={actual!r}')

    def section(self, sheet, excel_rows, seed_rows, key_of):
        if len(excel_rows) != len(seed_rows):
            self.problems.append(
                f'{sheet} 행 수: 엑셀={len(excel_rows)} 시드={len(seed_rows)}'
            )
        for index, (excel, seed) in enumerate(zip(excel_rows, seed_rows)):
            yield key_of(excel, index), excel, seed


SEED_SOURCES = {
    'baseAt': ('index.ts', 'SEED_BASE_AT'),
    'items': ('items.ts', 'SEED_ITEMS'),
    'bundleComponents': ('bundles.ts', 'SEED_BUNDLE_COMPONENTS'),
    'warehouses': ('warehouses.ts', 'SEED_WAREHOUSES'),
    'inventories': ('inventories.ts', 'SEED_INVENTORIES'),
    'serials': ('serials.ts', 'SEED_SERIALS'),
    'orderRows': ('orders.ts', 'SEED_ORDER_ROWS'),
    'incomingDocuments': ('incoming.ts', 'SEED_INCOMING_DOCUMENTS'),
    'suppliers': ('suppliers.ts', 'SEED_SUPPLIERS'),
}


def load_seed(root):
    seed_dir = os.path.join(root, 'src', 'data', 'seed')
    return {
        key: read_seed.read(os.path.join(seed_dir, filename), name)
        for key, (filename, name) in SEED_SOURCES.items()
    }


def main(xlsx_path):
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    book = read_sheets(xlsx_path)
    seed = load_seed(root)
    report = Report()

    # ---- 00_안내 기준시각 ----
    guide = book['00_안내']
    base = next(row for row in guide if row and row[0] == '기준시각')
    report.compare('00_안내', '기준시각', 'baseAt', iso_datetime(base[1]), seed['baseAt'])

    # ---- 01_품목 ----
    for key, excel, s in report.section(
        '01_품목', as_records(book['01_품목']), seed['items'], lambda e, i: e['품목코드']
    ):
        report.compare('01_품목', key, 'itemCode', excel['품목코드'], s['itemCode'])
        report.compare('01_품목', key, 'itemName', excel['품목명'], s['itemName'])
        report.compare('01_품목', key, 'category', excel['분류'], s['category'])
        report.compare('01_품목', key, 'specification', blank_to_none(excel['규격']), s.get('specification'))
        report.compare('01_품목', key, 'itemType', excel['품목유형'], s['itemType'])
        report.compare('01_품목', key, 'serialManaged', yes_no(excel['시리얼관리여부']), s['serialManaged'])
        report.compare(
            '01_품목', key, 'defaultSupplierCode',
            blank_to_none(excel['기본공급처코드']), s.get('defaultSupplierCode'),
        )

    # ---- 02_세트구성 ----
    for key, excel, s in report.section(
        '02_세트구성', as_records(book['02_세트구성']), seed['bundleComponents'],
        lambda e, i: f"{e['세트품목코드']}/{e['구성품코드']}",
    ):
        report.compare('02_세트구성', key, 'bundleItemCode', excel['세트품목코드'], s['bundleItemCode'])
        report.compare('02_세트구성', key, 'componentItemCode', excel['구성품코드'], s['componentItemCode'])
        report.compare('02_세트구성', key, 'quantity', number(excel['구성수량']), s['quantity'])
        report.compare('02_세트구성', key, 'isOutboundTarget', yes_no(excel['출고대상여부']), s['isOutboundTarget'])

    # ---- 03_창고 ----
    for key, excel, s in report.section(
        '03_창고', as_records(book['03_창고']), seed['warehouses'], lambda e, i: e['창고코드']
    ):
        report.compare('03_창고', key, 'warehouseCode', excel['창고코드'], s['warehouseCode'])
        report.compare('03_창고', key, 'warehouseName', excel['창고명'], s['warehouseName'])
        report.compare('03_창고', key, 'status', excel['운영상태'], s['status'])

    # ---- 04_재고현황 ----
    for key, excel, s in report.section(
        '04_재고현황', as_records(book['04_재고현황']), seed['inventories'],
        lambda e, i: f"{e['창고코드']}/{e['품목코드']}",
    ):
        report.compare('04_재고현황', key, 'baseAt', iso_datetime(excel['기준시각']), s['baseAt'])
        report.compare('04_재고현황', key, 'warehouseCode', excel['창고코드'], s['warehouseCode'])
        report.compare('04_재고현황', key, 'itemCode', excel['품목코드'], s['itemCode'])
        report.compare('04_재고현황', key, 'currentQuantity', number(excel['현재고']), s['currentQuantity'])
        report.compare('04_재고현황', key, 'reservedQuantity', number(excel['예약수량']), s['reservedQuantity'])
        report.compare(
            '04_재고현황', key, 'existingReservationOrderId',
            blank_to_none(excel['기존예약주문번호']), s.get('existingReservationOrderId'),
        )

    # ---- 05_개체재고 ----
    for key, excel, s in report.section(
        '05_개체재고', as_records(book['05_개체재고']), seed['serials'], lambda e, i: e['시리얼번호']
    ):
        report.compare('05_개체재고', key, 'serialNumber', excel['시리얼번호'], s['serialNumber'])
        report.compare('05_개체재고', key, 'itemCode', excel['품목코드'], s['itemCode'])
        report.compare('05_개체재고', key, 'warehouseCode', excel['창고코드'], s['warehouseCode'])
        report.compare('05_개체재고', key, 'location', excel['보관위치'], s['location'])
        report.compare('05_개체재고', key, 'status', excel['개체상태'], s['status'])
        report.compare(
            '05_개체재고', key, 'reservedOrderId',
            blank_to_none(excel['예약주문번호']), s.get('reservedOrderId'),
        )
        report.compare('05_개체재고', key, 'receivedAt', iso_datetime(excel['입고일시']), s['receivedAt'])

    # ---- 06_주문 ----
    for key, excel, s in report.section(
        '06_주문', as_records(book['06_주문']), seed['orderRows'],
        lambda e, i: f"{e['주문번호']}#{e['품목순번']}",
    ):
        report.compare('06_주문', key, 'orderId', excel['주문번호'], s['orderId'])
        report.compare('06_주문', key, 'itemSequence', number(excel['품목순번']), s['itemSequence'])
        report.compare('06_주문', key, 'orderStatus', excel['주문상태'], s['orderStatus'])
        report.compare('06_주문', key, 'itemStatus', excel['품목상태'], s['itemStatus'])
        report.compare('06_주문', key, 'orderedAt', iso_datetime(excel['주문접수일시']), s['orderedAt'])
        report.compare('06_주문', key, 'deliveryDate', iso_date(excel['배송예정일']), s['deliveryDate'])
        report.compare('06_주문', key, 'warehouseCode', excel['출고창고코드'], s['warehouseCode'])
        report.compare('06_주문', key, 'itemCode', excel['품목코드'], s['itemCode'])
        report.compare('06_주문', key, 'quantity', number(excel['수량']), s['quantity'])
        report.compare('06_주문', key, 'updatedAt', iso_datetime(excel['수정일시']), s['updatedAt'])

    # ---- 07_입고예정 ----
    for key, excel, s in report.section(
        '07_입고예정', as_records(book['07_입고예정']), seed['incomingDocuments'],
        lambda e, i: e['문서번호'],
    ):
        report.compare('07_입고예정', key, 'documentId', excel['문서번호'], s['documentId'])
        report.compare('07_입고예정', key, 'documentType', excel['문서구분'], s['documentType'])
        report.compare('07_입고예정', key, 'itemCode', excel['품목코드'], s['itemCode'])
        report.compare('07_입고예정', key, 'warehouseCode', excel['입고창고코드'], s['warehouseCode'])
        report.compare('07_입고예정', key, 'status', excel['진행상태'], s['status'])
        report.compare('07_입고예정', key, 'plannedQuantity', number(excel['계획수량']), s['plannedQuantity'])
        report.compare('07_입고예정', key, 'receivedQuantity', number(excel['입고수량']), s['receivedQuantity'])
        report.compare('07_입고예정', key, 'availableDate', iso_date(excel['사용가능예정일']), s['availableDate'])
        report.compare('07_입고예정', key, 'inspectionStatus', excel['검사상태'], s['inspectionStatus'])
        report.compare('07_입고예정', key, 'confirmed', yes_no(excel['확정여부']), s['confirmed'])
        report.compare('07_입고예정', key, 'supplierCode', excel['공급처코드'], s['supplierCode'])

    # ---- 08_공급처 ----
    for key, excel, s in report.section(
        '08_공급처', as_records(book['08_공급처']), seed['suppliers'], lambda e, i: e['공급처코드']
    ):
        report.compare('08_공급처', key, 'supplierCode', excel['공급처코드'], s['supplierCode'])
        report.compare('08_공급처', key, 'supplierName', excel['공급처명'], s['supplierName'])
        report.compare('08_공급처', key, 'type', excel['구분'], s['type'])
        report.compare('08_공급처', key, 'leadTimeDays', number(excel['리드타임일수']), s['leadTimeDays'])

    print(f'대조한 셀: {report.checked}')
    if report.problems:
        print(f'불일치 {len(report.problems)}건')
        for problem in report.problems:
            print('  ' + problem)
        return 1
    print('불일치 없음. 시드는 엑셀과 1:1 이다.')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
