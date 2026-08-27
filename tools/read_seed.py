"""data/seed/*.ts 의 배열 리터럴을 파이썬 값으로 읽는다.

시드를 JSON 으로 한 번 내보낸 뒤 비교하면 그 JSON 이 두 번째 출처가 된다.
그래서 .ts 를 직접 읽는다 — 시드 파일은 계산식 없이 리터럴만 담기로 한
규칙(README '데이터')이 있어 이만한 파서로 충분하다.

지원: 객체 · 배열 · 작은따옴표 문자열 · 숫자 · true/false · 주석 · 후행 쉼표.
그 밖의 문법을 만나면 조용히 넘기지 않고 예외를 던진다.
"""

import re

TOKEN = re.compile(
    r"""
      (?P<ws>\s+)
    | (?P<line_comment>//[^\n]*)
    | (?P<block_comment>/\*.*?\*/)
    | (?P<string>'(?:[^'\\]|\\.)*')
    | (?P<number>-?\d+(?:\.\d+)?)
    | (?P<word>[A-Za-z_$][A-Za-z0-9_$]*)
    | (?P<punct>[{}\[\],:])
    """,
    re.VERBOSE | re.DOTALL,
)

SKIP = {'ws', 'line_comment', 'block_comment'}


def tokenize(text, start, end):
    pos = start
    while pos < end:
        match = TOKEN.match(text, pos)
        if not match:
            raise ValueError(f'읽을 수 없는 문자: {text[pos:pos + 40]!r}')
        pos = match.end()
        kind = match.lastgroup
        if kind in SKIP:
            continue
        yield kind, match.group()


class Parser:
    def __init__(self, tokens):
        self.tokens = list(tokens)
        self.at = 0

    def peek(self):
        return self.tokens[self.at] if self.at < len(self.tokens) else (None, None)

    def next(self):
        token = self.peek()
        self.at += 1
        return token

    def expect(self, value):
        kind, text = self.next()
        if text != value:
            raise ValueError(f'{value!r} 를 기대했으나 {text!r}')

    def value(self):
        kind, text = self.next()
        if text == '[':
            return self.array()
        if text == '{':
            return self.obj()
        if kind == 'string':
            return unquote(text)
        if kind == 'number':
            return float(text) if '.' in text else int(text)
        if text == 'true':
            return True
        if text == 'false':
            return False
        if text == 'undefined':
            return None
        raise ValueError(f'값으로 읽을 수 없다: {text!r}')

    def array(self):
        out = []
        while True:
            kind, text = self.peek()
            if text == ']':
                self.next()
                return out
            out.append(self.value())
            if self.peek()[1] == ',':
                self.next()

    def obj(self):
        out = {}
        while True:
            kind, text = self.next()
            if text == '}':
                return out
            key = unquote(text) if kind == 'string' else text
            self.expect(':')
            out[key] = self.value()
            if self.peek()[1] == ',':
                self.next()


def unquote(text):
    body = text[1:-1]
    return re.sub(r'\\(.)', r'\1', body)


def find_literal(text, name):
    """`export const NAME... = <literal>` 의 리터럴 범위를 찾는다"""
    match = re.search(rf'export const {re.escape(name)}\b[^=]*=\s*', text)
    if not match:
        raise ValueError(f'{name} 을(를) 찾을 수 없다')
    start = match.end()

    opener = text[start]
    if opener not in '[{':
        # 스칼라 — 다음 줄바꿈까지
        end = text.index('\n', start)
        return start, end

    closer = ']' if opener == '[' else '}'
    depth = 0
    index = start
    in_string = False
    while index < len(text):
        ch = text[index]
        if in_string:
            if ch == '\\':
                index += 2
                continue
            if ch == "'":
                in_string = False
        elif ch == "'":
            in_string = True
        elif ch == opener:
            depth += 1
        elif ch == closer:
            depth -= 1
            if depth == 0:
                return start, index + 1
        index += 1
    raise ValueError(f'{name} 의 리터럴이 닫히지 않았다')


def read(path, name):
    text = open(path, encoding='utf-8').read()
    start, end = find_literal(text, name)
    parser = Parser(tokenize(text, start, end))
    return parser.value()
