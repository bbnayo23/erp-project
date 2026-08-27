"""xlsx -> TSV 덤프 (stdlib only).

xlsx 는 XML 의 zip 이다. openpyxl 없이 시트별로 셀을 그대로 뽑아
시드 데이터와 셀 단위로 대조할 수 있게 한다.

날짜는 엑셀 serial 이라 그대로 두면 45000 같은 숫자로만 보인다.
styles.xml 의 numFmt 를 보고 날짜 서식인 셀만 ISO 로 되돌린다.
"""

import datetime as dt
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

NS = {
    'm': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'pr': 'http://schemas.openxmlformats.org/package/2006/relationships',
}

# 엑셀 내장 날짜/시간 서식 번호
BUILTIN_DATE_FMTS = set(range(14, 23)) | set(range(45, 48))
EXCEL_EPOCH = dt.datetime(1899, 12, 30)


def col_index(ref):
    """'BC12' -> 54 (0-based column)"""
    letters = re.match(r'[A-Z]+', ref).group(0)
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def load_shared_strings(z):
    if 'xl/sharedStrings.xml' not in z.namelist():
        return []
    root = ET.fromstring(z.read('xl/sharedStrings.xml'))
    out = []
    for si in root.findall('m:si', NS):
        out.append(''.join(t.text or '' for t in si.iter(f'{{{NS["m"]}}}t')))
    return out


def load_date_styles(z):
    """날짜 서식이 걸린 cellXfs 인덱스 집합"""
    root = ET.fromstring(z.read('xl/styles.xml'))

    custom = {}
    for numfmt in root.iter(f'{{{NS["m"]}}}numFmt'):
        code = numfmt.get('formatCode', '')
        # 서식 문자열에서 따옴표 안의 리터럴을 뺀 뒤 날짜 기호를 찾는다
        stripped = re.sub(r'"[^"]*"', '', code)
        if re.search(r'[ymdhs]', stripped, re.IGNORECASE):
            custom[int(numfmt.get('numFmtId'))] = code

    date_styles = set()
    xfs = root.find('m:cellXfs', NS)
    if xfs is None:
        return date_styles
    for i, xf in enumerate(xfs.findall('m:xf', NS)):
        fmt_id = int(xf.get('numFmtId', 0))
        if fmt_id in BUILTIN_DATE_FMTS or fmt_id in custom:
            date_styles.add(i)
    return date_styles


def to_datetime(serial):
    return EXCEL_EPOCH + dt.timedelta(days=float(serial))


def sheets(z):
    """(시트명, 시트 xml 경로) 를 워크북 순서대로"""
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    target = {
        rel.get('Id'): rel.get('Target').lstrip('/')
        for rel in rels.findall('pr:Relationship', NS)
    }
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    out = []
    for sheet in wb.find('m:sheets', NS).findall('m:sheet', NS):
        path = target[sheet.get(f'{{{NS["r"]}}}id')]
        out.append((sheet.get('name'), path if path.startswith('xl/') else f'xl/{path}'))
    return out


def cell_value(cell, shared, date_styles):
    t = cell.get('t')
    if t == 'inlineStr':
        node = cell.find('m:is', NS)
        return ''.join(x.text or '' for x in node.iter(f'{{{NS["m"]}}}t')) if node is not None else ''

    v = cell.find('m:v', NS)
    if v is None or v.text is None:
        return ''
    raw = v.text

    if t == 's':
        return shared[int(raw)]
    if t == 'b':
        return 'TRUE' if raw == '1' else 'FALSE'
    if t in ('str', 'e'):
        return raw

    style = int(cell.get('s', 0))
    if style in date_styles:
        try:
            moment = to_datetime(raw)
        except ValueError:
            return raw
        # 시각이 0시면 날짜만 — 시트에서 눈으로 본 값과 같게 보이도록
        if moment.time() == dt.time(0, 0, 0):
            return moment.strftime('%Y-%m-%d')
        return moment.strftime('%Y-%m-%d %H:%M:%S.%f').rstrip('0').rstrip('.')
    return raw


def dump(path):
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
                    cells[col_index(ref)] = cell_value(cell, shared, date_styles)
                width = max(cells) + 1 if cells else 0
                rows.append([cells.get(i, '') for i in range(width)])

            print(f'===== SHEET: {name} ({len(rows)}행) =====')
            for row in rows:
                print('\t'.join(row))
            print()


if __name__ == '__main__':
    dump(sys.argv[1])
