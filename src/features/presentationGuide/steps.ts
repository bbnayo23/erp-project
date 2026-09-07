import type { GuideStep } from './types'

type SlideStep = Omit<GuideStep, 'id' | 'slide' | 'slideLabel'>

/** 슬라이드 하나 분량의 포인트를 받아 id·slide·slideLabel 을 채운 GuideStep[] 로 편다 */
const slide = (num: number, label: string, steps: SlideStep[]): GuideStep[] =>
  steps.map((step, index) => ({
    id: `s${num}-${index + 1}`,
    slide: num,
    slideLabel: label,
    ...step,
  }))

const DEMO_ORDER = 'ORD202607210029'
const EXCEPTION_ORDER = 'ORD202607200011'
const DEMO_ITEM_PATH = '/items/FRM-DMN-Q:WH-HQ'

/**
 * 재고흐름 ERP 발표 가이드 — 재고흐름ERP_발표대본.md 를 그대로 화면 위 스텝으로 옮긴 것.
 *
 * 대본의 "n번" 포인트 하나가 스텝 하나다. 화면이 없는 인트로·마무리 슬라이드는 강조 없이
 * 가운데 카드만 띄운다. 발주 생성처럼 발표 중 실제로 만들어지는 문서(PO-20260721-DMN 등)는
 * 경로를 문서번호까지 고정하지 않는다 — 그 문서는 발표자가 방금 만든 것이라 리허설 시점에는
 * 존재하지 않을 수 있다. 그 자리는 목록/상세 화면까지만 이동하고, 실제 클릭은 발표자가 한다.
 */
export const GUIDE_STEPS: GuideStep[] = [
  ...slide(1, '타이틀', [
    {
      title: '재고 흐름 ERP',
      body: '물류 담당자가 주문을 받아 실제 출고까지 처리하는 과정을 화면으로 만들었습니다. 화면 번호가 어떤 업무 규칙과 계산을 거쳐 나온 숫자인지 이어서 설명합니다.',
    },
  ]),

  ...slide(2, '문제 정의', [
    {
      title: '주문서의 숫자 ≠ 창고의 숫자',
      body: '주문서에는 세트 1개, 서비스 1개로 적히지만 창고에는 세트라는 물건이 없습니다. 매트리스와 프레임이 따로 있을 뿐입니다. 주문서의 숫자를 창고의 숫자로 바꾸는 것이 이 과정의 핵심입니다.',
    },
    {
      selector: 'nav',
      title: '화면은 세 개, 규칙은 그 사이 연결',
      body: '제품 · 주문 · 발주 세 메뉴가 축입니다. 부족 품목에서 발주를 만들고, 입고되면 현재고가 늘어 주문이 다시 확정되고, 출고하면 현재고와 예약수량이 함께 줍니다.',
    },
  ]),

  ...slide(3, '화면 흐름도', [
    {
      selector: 'nav',
      title: '메뉴 셋, 화면 여섯',
      body: '재고를 직접 고치는 화면은 없습니다. 재고는 예약 · 출고 · 입고를 통해서만 바뀝니다 — 규칙을 우회할 손잡이를 아예 두지 않았습니다.',
    },
    {
      title: '오늘의 예시 주문',
      body: `오늘은 ${DEMO_ORDER} 한 건을 끝까지 따라갑니다. 세트 1개 · 서비스 1개짜리 주문이 부족 판정을 받고, 발주를 만들고, 입고되고, 예약·출고까지 가는 여섯 화면을 순서대로 봅니다.`,
    },
  ]),

  // ── SCR-01 제품 · 재고 현황 ──────────────────────────────────────────
  ...slide(4, 'SCR-01 · 제품 · 재고 현황', [
    {
      path: '/items',
      selector: 'items.header',
      title: '② 가용재고 = 현재고 − 예약수량',
      body: '이 화면의 기준선입니다. 모든 판정은 지금 창고에 무엇이 얼마나 있는가에서 출발합니다.',
    },
    {
      path: '/items',
      selector: 'items.list',
      title: '⑤ 목록이 핵심',
      body: '창고별로 현재고 · 예약 · 가용재고 · 입고예정을 한 줄에서 봅니다. 입고예정은 확정된 문서만 합산합니다 — 미확정 문서는 아직 예정 수량으로 잡지 않는다는 규칙 3-2 때문입니다.',
    },
    {
      path: '/items',
      selector: 'items.inactiveBadge',
      title: '⑦ 사용 중지 배지',
      body: '재고가 남아 있어도 이 창고는 출고 준비 대상과 발주 대상에서 제외됩니다. 숨기지 않고 배지로 드러내야 담당자가 예상과 다른 결과를 화면에서 바로 대조할 수 있습니다.',
    },
    {
      path: '/items',
      selector: 'items.serialButton',
      title: '⑧ 개체 이력',
      body: '시리얼 관리 품목만 보관 n · 배정 n 을 예약합니다. 눌러 열면 URL 이 바뀌어, 다른 화면에서 "이 품목 보기"로 바로 건너올 수 있습니다.',
    },
  ]),

  // ── SCR-01-1 품목 상세 진입 ──────────────────────────────────────────
  ...slide(5, 'SCR-01-1 · 품목 상세 진입', [
    {
      path: DEMO_ITEM_PATH,
      selector: 'items.drawer.identity',
      title: '② 가용재고 = 현재고 − 예약수량',
      body: '데이먼 프레임 Q, 본사물류창고입니다. 가용재고 1 = 현재고 1 − 예약 0. 가용재고는 저장된 값이 아니라 볼 때마다 다시 계산합니다.',
    },
    {
      path: DEMO_ITEM_PATH,
      selector: 'items.drawer.identitySerial',
      title: '② 현재고 = 보관 + 배정',
      body: '현재고 1 = 보관 1 + 배정 0. 두 항등식이 어긋나면 등호가 ≠ 로 바뀌고 붉게 섭니다 — 담당자가 직접 검산할 수 있어야 합니다.',
    },
    {
      path: DEMO_ITEM_PATH,
      selector: 'items.drawer.serials',
      title: '③ 개체 목록',
      body: '이 개체가 어느 주문에 배정됐는지가 요구조건 4-1입니다.',
    },
    {
      path: DEMO_ITEM_PATH,
      selector: 'items.drawer.demands',
      title: '④ 이 품목을 기다리는 주문',
      body: '배정 순서가 빠른 주문이 재고를 먼저 가져갑니다. 배송일이 빠른 주문은 바로 준비 가능으로, 늦은 주문은 재고 부족으로 갈립니다.',
    },
    {
      path: DEMO_ITEM_PATH,
      selector: 'items.drawer.documents',
      title: '⑤ 걸려 있는 발주 · 생산의뢰',
      body: '배송 예정일을 못 맞추는 물량은 대기 근거가 되지 못합니다 — 있어도 부족은 부족입니다.',
    },
    {
      path: DEMO_ITEM_PATH,
      selector: 'items.drawer.movements',
      title: '⑥ 재고 이력 — 아직 비어 있음',
      body: '지금은 이 품목에 처리한 것이 없어 비어 있습니다. 뒤에서 발주 · 입고 · 예약 · 출고를 마친 뒤 같은 화면으로 다시 옵니다.',
    },
  ]),

  // ── SCR-01-1 품목 상세 — 재고 이력(처리 후) ──────────────────────────
  ...slide(6, 'SCR-01-1 · 재고 이력 (처리 후)', [
    {
      path: DEMO_ITEM_PATH,
      selector: 'items.drawer.movements',
      title: '③ 재고 이력 — 규칙 ①의 결과',
      body: `기존 발주 PO-20260719 가 입고되어 +2(현재고 3), 이번 주문이 만든 발주 PO-20260721 이 입고되어 +1(현재고 4), 예약으로 예약수량 1, 출고로 현재고 3 · 예약수량 0. 예약은 예약수량만 움직이고 현재고는 그대로입니다. 출고할 때 현재고와 예약수량이 함께 줍니다. 입고는 현재고만 늘립니다.`,
    },
    {
      path: DEMO_ITEM_PATH,
      selector: 'items.drawer.serials',
      title: '① 개체 목록도 같이 바뀜',
      body: '출고 완료 개체는 "출고 완료"에 배정 주문이 남고, 입고로 새로 생긴 개체는 "창고 보관 중"입니다.',
    },
    {
      path: DEMO_ITEM_PATH,
      selector: 'items.drawer.movements',
      title: '④ 근거 링크',
      body: '주문번호 · 문서번호가 링크라서 주문 → 발주 → 품목이 서로 오갈 수 있습니다.',
    },
  ]),

  // ── SCR-02 주문 · 배송 준비 현황 ─────────────────────────────────────
  ...slide(7, 'SCR-02 · 주문 · 배송 준비 현황', [
    {
      path: '/orders',
      selector: 'prep.summary',
      title: '① 요약 카드',
      body: '예약 가능 11건, 재고 기다림 5건, 발주 필요 7건, 확인 필요 3건. 카드를 누르면 목록이 그 상태로 걸러집니다 — 필터를 다시 찾아 고를 필요가 없습니다.',
    },
    {
      path: '/orders',
      selector: 'prep.list',
      title: '⑤ 순위 = 배정 순서',
      body: '배송예정일이 빠른 주문부터 재고를 배정받습니다. 같은 품목을 원하는 두 주문의 상태가 다른 이유가 이 순서입니다.',
    },
    {
      path: '/orders',
      selector: 'prep.list',
      title: '⑥ 준비상태 6가지',
      body: '대기를 한 태그로 몰지 않는 이유는 재고 부족과 확인 필요를 구분해야 하기 때문입니다.',
    },
    {
      path: '/orders',
      selector: 'prep.filter',
      title: '③ 취소 처리',
      body: '취소 · 출고 완료 · 배송 완료 주문은 기본으로 숨기고, 필요하면 "제외 주문 포함" 체크박스로만 조회합니다.',
    },
  ]),

  // ── SCR-02-1 주문 상세 — 재고 부족 ───────────────────────────────────
  ...slide(8, 'SCR-02-1 · 주문 상세 → 재고 부족', [
    {
      path: `/orders/${DEMO_ORDER}`,
      selector: 'order.orderedTable',
      title: '⑤ 주문 품목 — 06_주문 원본',
      body: '세트 1, 서비스 1. 세트는 "세트 전개 → Z10 매트리스 Q 1개, 데이먼 프레임 Q 1개"로, 서비스는 "재고로 관리하지 않아 준비 수요에서 제외"로 풀립니다.',
    },
    {
      path: `/orders/${DEMO_ORDER}`,
      selector: 'order.itemTable',
      title: '⑥ 준비 품목 — 세트 행이 없음',
      body: '매트리스는 가용재고 1이 있어 부족 0, 프레임은 가용 0 · 입고예정 0이라 부족 1. 부족 = 필요 − 가용재고 − 입고예정.',
    },
    {
      path: `/orders/${DEMO_ORDER}`,
      selector: 'order.stepsBar',
      title: '③ 처리 단계 네 칸',
      body: '부족분 발주 → 입고 → 예약 → 출고. 재고로 바로 채워지는 주문은 발주 · 입고 칸을 건너뜁니다.',
    },
    {
      path: `/orders/${DEMO_ORDER}`,
      selector: 'order.nextAction',
      title: '④ 다음 할 일은 하나만',
      body: '"부족분 발주 생성"을 누르면 발주 생성 화면으로 넘어갑니다. 버튼은 상태에 따라 감추지, 비활성으로 남기지 않습니다 — 이유는 위 표에 있습니다.',
    },
    {
      path: `/orders/${DEMO_ORDER}`,
      selector: 'order.shortageLink',
      title: '⑦ 이 품목만 발주',
      body: '부족한 품목마다 개별 발주로 가는 링크도 있습니다. 머리말의 부족분 발주는 전부를 한 번에 내고, 이 링크는 한 품목만 손봅니다.',
    },
    {
      path: `/orders/${DEMO_ORDER}`,
      selector: 'order.incomingTable',
      title: '⑧ 입고예정 표',
      body: '이 주문이 무엇을 기다리는지, 그 문서를 바로 검사 · 입고할 수 있는 버튼까지 한 화면에 있습니다.',
    },
  ]),

  // ── SCR-02-1 주문 상세 — 예약 완료 → 출고 ────────────────────────────
  ...slide(9, 'SCR-02-1 · 주문 상세 → 예약 완료 → 출고', [
    {
      path: `/orders/${DEMO_ORDER}`,
      selector: 'order.stepsBar',
      title: '발주와 입고를 마친 뒤',
      body: '입고로 재고가 늘어 시스템이 이 주문을 다시 판정했습니다. 재고 부족에서 바로 준비 가능으로 바뀌었고, 예약 버튼을 눌러 예약 완료가 된 화면입니다.',
    },
    {
      path: `/orders/${DEMO_ORDER}`,
      selector: 'order.itemTable',
      title: '⑤ 가용재고 1/1, 부족 0',
      body: '예약은 됐지만 현재고는 그대로입니다. 물건은 아직 창고에 있고, 다른 주문이 못 가져가게 이 주문 몫으로 잡아둔 것입니다. 예약은 전부 아니면 하나도 안 잡습니다.',
    },
    {
      path: `/orders/${DEMO_ORDER}`,
      selector: 'order.serialTable',
      title: '⑥ 배정된 개체 — 시리얼 피킹',
      body: '같은 품목 · 같은 창고의 보관 중 개체를 먼저 입고된 것부터 배정합니다. 상태가 "주문 배정됨"으로 바뀌어 다른 주문은 고를 수 없습니다.',
    },
    {
      path: `/orders/${DEMO_ORDER}`,
      selector: 'order.nextAction',
      title: '③ 출고 — 규칙 ⑤ 멱등',
      body: '예약이 끝나면 예약 버튼이 사라지고 다음 할 일이 출고로 바뀝니다. 같은 요청 번호가 다시 오면 이미 처리한 요청으로 넘겨 이력이 한 줄만 쌓입니다. 출고를 누르면 현재고와 예약수량이 함께 줄고 개체가 출고 완료가 됩니다.',
    },
  ]),

  // ── SCR-02-1 주문 상세 — 확인 필요 ───────────────────────────────────
  ...slide(10, 'SCR-02-1 · 주문 상세 → 확인 필요', [
    {
      path: `/orders/${EXCEPTION_ORDER}`,
      selector: 'order.header',
      title: '① 준비상태 = 확인 필요',
      body: '등록되지 않은 품목코드 UNKNOWN-SKU가 든 주문입니다. 그냥 무시하고 계산하면 필요 수량이 줄어 "부족 0"처럼 멀쩡해 보입니다 — 시스템이 모르는 것을 아는 척하면 안 되는 이유입니다.',
    },
    {
      path: `/orders/${EXCEPTION_ORDER}`,
      selector: 'order.stepsBar',
      title: '② 처리 단계 전부 비활성',
      body: '발주 · 예약 버튼이 뜨지 않습니다. 사유가 하나라도 있으면 정상 품목까지 포함해 이 주문의 재고를 한 개도 잡지 않습니다.',
    },
    {
      path: `/orders/${EXCEPTION_ORDER}`,
      selector: 'order.blocks',
      title: '④ 확인 필요 사유',
      body: '담당자가 읽을 수 있는 한글 사유가 그대로 붙습니다.',
    },
    {
      path: `/orders/${EXCEPTION_ORDER}`,
      selector: 'order.itemTable',
      title: '⑥ 준비 품목 — 숫자를 채우지 않음',
      body: '사용 중지된 창고의 주문에 "5개 있음"을 띄우면 보낼 수 있다는 오해를 줍니다. 재고 변동 0, 발주 문서 0 — 다른 품목 · 창고로 대체하지도 않습니다.',
    },
  ]),

  // ── SCR-03-1 발주 생성 ───────────────────────────────────────────────
  ...slide(11, 'SCR-03-1 · 발주 생성', [
    {
      // 여기만 URL 로 건너뛰지 않는다 — 발주 생성 화면은 오직 이 링크를 눌러야만
      // 열리는 화면이라(발주 현황에도, 주문 상세 머리말 버튼에도 이 화면으로 가는
      // 길이 없다), 발표자가 실제로 이 링크를 클릭하는 것 자체가 보여줘야 할 동작이다.
      path: `/orders/${DEMO_ORDER}`,
      selector: 'order.shortageLink',
      title: '여기를 클릭 — "이 품목만 발주"',
      body: '발주 생성 화면은 이 링크로만 들어갑니다. 머리말의 "부족분 발주 생성" 버튼은 이 화면을 거치지 않고 바로 문서를 만들어버립니다 — 폼을 보여주려면 부족 품목 옆의 이 링크를 실제로 클릭해야 합니다.',
    },
    {
      path: `/inbound/new?itemCode=FRM-DMN-Q&warehouseCode=WH-HQ&orderId=${DEMO_ORDER}&quantity=1`,
      selector: 'issue.header',
      title: `① 출처 — "${DEMO_ORDER} 의 부족분에서 넘어왔습니다"`,
      body: '발주 문서가 어떤 주문 때문에 생겼는지 추적하라는 규칙 3-5의 출발점입니다.',
    },
    {
      path: `/inbound/new?itemCode=FRM-DMN-Q&warehouseCode=WH-HQ&orderId=${DEMO_ORDER}&quantity=1`,
      selector: 'issue.facts',
      title: '② 읽기 전용 값 셋',
      body: '품목 · 문서구분 · 입고창고는 이미 계산된 값입니다. 문서구분은 품목유형이(매입품→구매발주, 생산품→생산의뢰), 입고창고는 주문의 출고창고로 고정됩니다. 열어 고르게 하면 규칙을 어기는 입력이 가능해집니다.',
    },
    {
      path: `/inbound/new?itemCode=FRM-DMN-Q&warehouseCode=WH-HQ&orderId=${DEMO_ORDER}&quantity=1`,
      selector: 'issue.fields',
      title: '③④⑤ 담당자가 채우는 세 칸',
      body: '수량 · 공급처 · 사용가능예정일뿐입니다. 수량은 부족수량이, 공급처는 품목의 기본 공급처가, 사용가능일은 기준시각 + 리드타임이 기본값입니다.',
    },
    {
      path: `/inbound/new?itemCode=FRM-DMN-Q&warehouseCode=WH-HQ&orderId=${DEMO_ORDER}&quantity=1`,
      selector: 'issue.notice',
      title: '⑦ 발주해도 현재고는 그대로',
      body: '재고 이력만 하나 늘어납니다. 입고를 처리해야 현재고가 늘어납니다.',
    },
    {
      path: `/inbound/new?itemCode=FRM-DMN-Q&warehouseCode=WH-HQ&orderId=${DEMO_ORDER}&quantity=1`,
      selector: 'issue.submit',
      title: '⑧ 발주 생성 — 중복 방지',
      body: '같은 부족분으로 두 번 눌러도 문서는 한 건만 만들어집니다.',
    },
  ]),

  // ── SCR-03 발주 현황 (문서 목록) ─────────────────────────────────────
  ...slide(12, 'SCR-03 · 발주 현황 (문서 목록)', [
    {
      path: '/inbound',
      selector: 'purchase.list',
      title: '③ 항목 그래프 — 요구조건 4-3',
      body: '문서번호 · 구분 · 공급처, 품목, 입고창고, 계획 · 입고 · 잔여, 사용가능예정일, 진행상태 · 검사상태 · 확정여부, 단계, 처리 액션.',
    },
    {
      path: '/inbound',
      selector: 'purchase.list',
      title: '④ 제공 문서와 신규 문서가 한 목록에',
      body: '사전에 제공된 PO-20260719-DMN 과 방금 만든 PO-20260721-DMN 이 같은 목록에 있고, 신규 문서에는 "ORD202607210029 부족분"이라는 출처가 붙습니다.',
    },
    {
      path: '/inbound',
      selector: 'purchase.list',
      title: '⑤ 단계 배지 다섯 가지',
      body: '검사 대기 · 입고 대기 · 도착 예정 · 미확정 · 입고 완료. 미확정 문서에는 "확정되지 않은 재고라 아직 예정 수량으로 잡지 않는다"는 문구가 붙습니다.',
    },
    {
      path: '/inbound',
      selector: 'purchase.list',
      title: '⑥ 처리 액션은 문서 종류별로 다름',
      body: '구매발주는 입고, 생산의뢰는 검사 · 입고. 미확정 문서는 발주 확정 액션으로 먼저 확정해야 합니다 — 요구조건 4-5.',
    },
    {
      path: '/inbound',
      selector: 'purchase.history',
      title: '⑦ 재고 이력 — 아직 비어 있음',
      body: '입고를 처리하면 여기부터 쌓입니다. 뒤에서 다시 봅니다.',
    },
  ]),

  // ── SCR-03-2 검사 및 입고 모듈 (생산의뢰) ────────────────────────────
  ...slide(13, 'SCR-03-2 · 검사 및 입고 모듈 (생산의뢰)', [
    {
      path: '/inbound/MO-20260721-Z10',
      selector: 'receive.inspection',
      title: '③ ① 품질검사 결과 먼저',
      body: 'MO-20260721-Z10, Z10 매트리스 Q. 생산품은 검사를 통과해야 현재고가 됩니다. 검사 기록 없이는 입고로 못 갑니다. 불합격 수량만큼 계획수량이 줄어 앞으로도 들어오지 않습니다.',
    },
    {
      path: '/inbound/MO-20260721-Z10',
      selector: 'receive.receiving',
      title: '⑤ ② 입고는 합격수량만',
      body: '입고 수량이 합격수량만큼 자동으로 채워집니다 — 불합격분은 들어오지 않습니다.',
    },
    {
      path: '/inbound/MO-20260721-Z10',
      selector: 'receive.receiving',
      title: '⑤ 시리얼 자동 채번',
      body: '시리얼 관리 품목이라 합격 수량만큼 개체가 생성됩니다. 번호는 자동 채번되지만 실물 라벨과 다르면 고칠 수 있고, 중복이면 거부합니다.',
    },
    {
      path: '/inbound/MO-20260721-Z10',
      selector: 'receive.submit',
      title: '⑦ 부분 입고와 중복 요청',
      body: '입고는 예약과 달리 같은 문서에 부분 입고가 여러 번 있을 수 있습니다. 요청 번호는 성공한 다음에만 올라가 — 더블클릭은 한 번만 반영되고, 남은 수량을 넘는 요청은 거부됩니다.',
    },
  ]),

  // ── SCR-03-3 재고 처리 모듈 (구매발주 · 부분 입고) ───────────────────
  ...slide(14, 'SCR-03-3 · 재고 처리 모듈 (구매발주 · 부분 입고)', [
    {
      path: '/inbound/PO-20260719-DMN',
      selector: 'receive.facts',
      title: '① 계획 3 · 기존 입고 1 · 남은 2',
      body: 'PO-20260719-DMN, 부분 입고 문서입니다. 기존 입고 1은 이미 현재고에 반영된 수량이고, 앞으로 들어올 수량은 계획 − 입고 = 2입니다(규칙 3-2).',
    },
    {
      path: '/inbound/PO-20260719-DMN',
      selector: 'receive.receiving',
      title: '② 입고 수량 — 최대 2',
      body: '남은 수량이 기본값이고, 초과 입력은 거부됩니다. 발주 수량보다 많이 오면 발주수량을 고치는 별개의 일이기 때문입니다.',
    },
    {
      path: '/inbound/PO-20260719-DMN',
      selector: 'receive.receiving',
      title: '③ 시리얼 입력 — 구매발주는 검사 없음',
      body: '구매발주는 검사 단계가 없어 화면이 더 단순합니다. 시리얼 입력은 시리얼 관리 품목일 때만 나옵니다.',
    },
    {
      path: '/inbound/PO-20260719-DMN',
      selector: 'receive.submit',
      title: '④ 입고 처리 → 현재고 증가 → 주문 재확정',
      body: '현재고가 늘고 재고 이력에 한 줄 남고, 이 재고를 기다리는 주문이 다시 확정됩니다. 이 두 건의 처리로 재고 이력은 +2, +1 — 그 결과 앞 주문이 재고 부족에서 바로 준비 가능으로 바뀝니다.',
    },
  ]),

  // ── SCR-03-4 발주 현황 → 재고 이력 ───────────────────────────────────
  ...slide(15, 'SCR-03-4 · 발주 현황 → 재고 이력', [
    {
      path: '/inbound',
      selector: 'purchase.history',
      title: '③ 문서번호 · 입고수량 · 입고 후 현재고 · 풀린 주문 · 처리시각',
      body: '입고예정 → 재고 이력 → 주문 재확정, 요구조건 4-4가 여기서 완성됩니다.',
    },
    {
      path: '/inbound',
      selector: 'purchase.history',
      title: '④ 풀린 주문',
      body: `PO-20260721-DMN 입고로 ${DEMO_ORDER} 가 "바로 준비 가능"으로 바뀌었다고 적힙니다. 클릭하면 그 주문 상세로 갑니다.`,
    },
    {
      path: '/inbound',
      selector: 'purchase.history',
      title: '⑤ 입고 후 현재고 4 · 3 · 5',
      body: '품목 재고 이력에 남은 잔액과 같은 값입니다. 화면이 셋이라도 숫자는 하나의 계산에서 나옵니다.',
    },
    {
      path: '/inbound',
      selector: 'purchase.list',
      title: '①② 완료 문서 · 미확정 문서',
      body: '완료 문서는 사유 없이 다시 입고할 수 있고, 미확정 문서는 발주 확정만 할 수 있습니다. 같은 입고 요청을 두 번 보내도 이력은 한 줄만 쌓입니다.',
    },
  ]),

  ...slide(16, '요구조건 · 시나리오 → 화면 대응 / 마무리', [
    {
      title: '검증 — 401개 중 규칙 테스트 255개',
      body: '화면에서 보인 것은 전부 자동화 테스트로도 검증했습니다. 재고를 계산하는 코드가 화면을 모르기 때문에 가능한 일입니다. 주문 29건이 같은 재고를 두고 경쟁하는 상황도 골든 파일로 통짜 검증했습니다.',
    },
    {
      title: '핵심 한 줄',
      body: '이 과정의 핵심은 주문서의 숫자를 그대로 재고에 적용하는 것이 아니라, 실제 창고에서 움직이는 물건으로 바꾼 뒤 출고 가능 여부를 판단하는 것입니다. 오늘 본 화면은 전부 그 변환 과정입니다.',
    },
  ]),
]
