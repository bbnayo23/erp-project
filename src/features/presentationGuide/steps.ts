import { DEMO_ORDER } from './demo'
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

const EXCEPTION_ORDER = 'ORD202607200011'
const DEMO_ITEM_PATH = '/items/FRM-DMN-Q:WH-HQ'
const ORDER_PATH = `/orders/${DEMO_ORDER}`
const ISSUE_PATH = `/inbound/new?itemCode=FRM-DMN-Q&warehouseCode=WH-HQ&orderId=${DEMO_ORDER}&quantity=1`
/** Z10 매트리스 Q 생산의뢰 — 검사를 거쳐야 입고되는 문서 */
const PRODUCTION_PATH = '/inbound/MO-20260721-Z10'
/** 데이먼 프레임 Q 구매발주 — 계획 3 · 기존 입고 1 의 부분 입고 문서 */
const PURCHASE_PATH = '/inbound/PO-20260719-DMN'

/**
 * 재고흐름 ERP 발표 가이드 — 발표 메모(재고_흐름_ERP_발표_메모_최종.md)의 16개 절을
 * 그대로 화면 위 스텝으로 옮긴 것.
 *
 * 메모의 한 절이 슬라이드 하나이고, 그 절에서 짚는 포인트 하나가 스텝 하나다.
 * **본문은 메모를 그대로 옮기지 않는다.** 발표자는 말로 설명하고 이 카드는 강조된 자리가
 * 무엇인지 한 줄로 가리키는 역할이라, 메모의 문장을 대표하는 한두 문장만 남긴다.
 *
 * `demo` 는 그 화면이 성립하는 데 필요한 처리다. 입고 이력은 입고를 해야 한 줄이 생기고
 * 배정된 개체 표는 예약을 해야 채워지므로, 발표자가 아무것도 누르지 않아도 결과가 보이게
 * 가이드가 스토어 액션으로 맞춰 준다(demo.ts). `press` 를 켠 스텝은 강조한 자리가 실제
 * 버튼이라, 화면이 바뀌기 직전에 그 자리를 눌렀다는 표시를 한 번 띄운다.
 *
 * 화면이 없는 절(시작 · 개요 · 테스트 · 마무리)은 강조 없이 가운데 카드만 띄운다.
 */
export const GUIDE_STEPS: GuideStep[] = [
  // ── 01 시작 ──────────────────────────────────────────────────────────
  ...slide(1, '시작', [
    {
      title: '재고 흐름 ERP',
      body: '주문부터 재고 확인, 부족분 발주와 입고, 최종 출고까지 이어지는 재고 흐름을 화면으로 만들었습니다.',
    },
    {
      title: '무엇을 보실지',
      body: '결과 화면만이 아니라, 왜 이런 화면이 필요한지 · 숫자가 어떤 규칙으로 계산되는지 · 화면들이 어떻게 연결되는지를 함께 짚습니다.',
    },
  ]),

  // ── 02 프로젝트 개요 ─────────────────────────────────────────────────
  ...slide(2, '프로젝트 개요', [
    {
      title: '주문서의 숫자를 창고의 숫자로',
      body: '주문서에는 세트 1개로 적히지만 창고에 세트라는 물건은 없습니다. 매트리스와 프레임으로 전개하고, 수거 서비스는 재고 대상에서 제외합니다.',
    },
    {
      title: '전체 흐름',
      body: '주문 → 재고 확인 → 부족분 발주 → 입고 → 재판정 → 예약 → 출고.',
    },
    {
      selector: 'nav',
      title: '재고를 직접 고치는 화면은 없습니다',
      body: '예약 · 입고 · 출고처럼 실제 업무가 발생했을 때만 재고가 변경되도록 했습니다.',
    },
  ]),

  // ── 03 전체 화면 흐름 · 연결 관계 ────────────────────────────────────
  ...slide(3, '전체 화면 흐름', [
    {
      selector: 'nav',
      title: '메뉴 셋 — 제품 · 주문 · 발주',
      body: '제품에서 창고의 재고를 확인하고, 주문에서 그 재고로 준비할 수 있는지 판단하고, 부족하면 발주에서 채웁니다.',
    },
    {
      title: '화면이 이어지는 순서',
      body: '주문 상세의 부족 품목 → 발주 생성 → 발주 현황 → 입고 처리 → 현재고 증가 → 주문 재판정 → 예약 → 출고.',
    },
    {
      title: '오늘 따라갈 주문',
      body: `${DEMO_ORDER} 한 건을 부족 판정부터 출고까지 끝까지 따라갑니다.`,
    },
  ]),

  // ── 04 SCR-01 제품 › 재고 현황 ───────────────────────────────────────
  // 기준 숫자를 보여주는 화면이라 시드 상태에서 출발한다 — 리허설로 처리해 둔 것이
  // 남아 있으면 뒤 화면의 '이 숫자가 이렇게 바뀝니다' 가 성립하지 않는다.
  ...slide(4, 'SCR-01 · 제품 › 재고 현황', [
    {
      path: '/items',
      selector: 'items.header',
      demo: 'SEED',
      title: '첫 화면은 제품의 재고 현황',
      body: '현재고 · 예약 · 가용재고 · 입고예정을 한눈에 보여줍니다. 모든 판정이 이 숫자에서 출발합니다.',
    },
    {
      path: '/items',
      selector: 'items.list',
      demo: 'SEED',
      title: '가용재고 = 현재고 − 예약수량',
      body: '현재고가 6개이고 1개가 예약되어 있다면 실제로 사용할 수 있는 재고는 5개입니다.',
    },
    {
      path: '/items',
      selector: 'items.list',
      demo: 'SEED',
      title: '입고예정 = 확정된 발주의 잔여',
      body: '확정된 발주 중 이 창고로 들어올 예정인 잔여 수량만 계산합니다.',
    },
    {
      path: '/items',
      selector: 'items.inactiveBadge',
      demo: 'SEED',
      // 같은 배지가 사용 중지 창고 재고 여러 줄에 나타날 수 있다 — 여기서는 그중
      // 하나만 짚어 보여주면 되므로, 첫 줄만 강조해 포커스가 늘어지지 않게 한다.
      focusFirstMatch: true,
      title: '사용 중지된 창고',
      body: '데이터 확인을 위해 표시는 하되, 실제 주문 준비와 발주 판단에서는 제외합니다. 데이터 자체가 사라지면 오히려 확인하기 어렵기 때문입니다.',
    },
  ]),

  // ── 05 SCR-01-1 제품 › 품목 상세 진입 ────────────────────────────────
  ...slide(5, 'SCR-01-1 · 품목 상세', [
    {
      path: DEMO_ITEM_PATH,
      selector: 'items.drawer.identity',
      demo: 'SEED',
      title: '품목을 선택하면 열리는 상세 패널',
      body: '가용재고 1 = 현재고 1 − 예약 0. 저장된 값이 아니라 볼 때마다 다시 계산합니다.',
    },
    {
      path: DEMO_ITEM_PATH,
      selector: 'items.drawer.identitySerial',
      demo: 'SEED',
      title: '현재고 = 보관 + 배정',
      body: '어긋나면 등호가 ≠ 로 바뀝니다 — 담당자가 직접 검산할 수 있어야 합니다.',
    },
    {
      path: DEMO_ITEM_PATH,
      selector: 'items.drawer.serials',
      demo: 'SEED',
      title: '시리얼 상태',
      body: '개체마다 지금 어느 주문에 배정되어 있는지가 남습니다.',
    },
    {
      path: DEMO_ITEM_PATH,
      selector: 'items.drawer.demands',
      demo: 'SEED',
      title: '이 품목을 기다리는 주문',
      body: '배송일이 빠른 주문이 재고를 먼저 가져갑니다.',
    },
    {
      path: DEMO_ITEM_PATH,
      selector: 'items.drawer.documents',
      demo: 'SEED',
      title: '연결된 발주 · 생산의뢰',
      body: '배송 예정일을 못 맞추는 물량은 대기 근거가 되지 못합니다.',
    },
    {
      path: DEMO_ITEM_PATH,
      selector: 'items.drawer.movements',
      demo: 'SEED',
      title: '재고 이력 — 아직 비어 있습니다',
      body: '재고 숫자만 보여주는 것이 아니라 계산 기준과 이력을 같이 보여줘, 왜 이 숫자가 되었는지 확인할 수 있게 했습니다. 처리를 마친 뒤 이 화면으로 다시 옵니다.',
    },
  ]),

  // ── 06 SCR-02 주문 › 배송 준비 현황 ──────────────────────────────────
  ...slide(6, 'SCR-02 · 주문 › 배송 준비 현황', [
    {
      path: '/orders',
      selector: 'prep.summary',
      demo: 'SEED',
      title: '어떤 주문부터 준비할지',
      body: '상태별 건수를 먼저 보여주고, 카드를 누르면 목록이 그 상태로 걸러집니다.',
    },
    {
      path: '/orders',
      selector: 'prep.list',
      demo: 'SEED',
      title: '우선순위 = 배송예정일 → 주문접수일시',
      body: '앞선 주문이 같은 재고를 먼저 사용하면 뒤 주문의 준비 가능 수량이 달라지기 때문에, 주문별 상태가 갈립니다.',
    },
    {
      path: '/orders',
      selector: 'prep.list',
      demo: 'SEED',
      title: '준비상태 여섯 가지',
      body: '바로 준비 가능 · 검사 대기 · 생산 대기 · 구매 대기 · 재고 부족 · 확인 필요. 왜 기다리고 있는지를 구분해야 다음 행동을 결정할 수 있습니다.',
    },
    {
      path: '/orders',
      selector: 'prep.filter',
      demo: 'SEED',
      title: '취소 · 출고 완료 주문',
      body: '기본 목록에서는 제외하고, 필요하면 토글로 조회만 할 수 있습니다.',
    },
  ]),

  // ── 07 SCR-02-1 주문 상세 — 세트 전개와 부족 ─────────────────────────
  ...slide(7, 'SCR-02-1 · 주문 상세 — 세트 전개와 부족', [
    {
      path: ORDER_PATH,
      selector: 'order.orderedTable',
      demo: 'SEED',
      title: '원 주문 그대로',
      body: '세트 1개 · 서비스 1개. 원 주문과 실제 창고에서 준비해야 하는 품목을 분리해서 보여줍니다.',
    },
    {
      path: ORDER_PATH,
      selector: 'order.itemTable',
      demo: 'SEED',
      title: '세트 전개와 서비스 제외',
      body: '세트 1개는 매트리스와 프레임으로 전개되고 수거 서비스는 빠집니다. 부족수량 = 필요수량 − 가용재고 − 입고예정.',
    },
    {
      path: ORDER_PATH,
      selector: 'order.stepsBar',
      demo: 'SEED',
      title: '처리 단계 네 칸',
      body: '부족분 발주 → 입고 → 예약 → 출고.',
    },
    {
      path: ORDER_PATH,
      selector: 'order.nextAction',
      demo: 'SEED',
      title: '지금 할 일은 하나만',
      body: '현재 단계에서 해야 할 다음 행동만 보여줍니다. 이 주문은 프레임이 1개 부족해 발주부터입니다.',
    },
  ]),

  // ── 08 SCR-03-1 발주 › 발주 생성 ─────────────────────────────────────
  ...slide(8, 'SCR-03-1 · 발주 생성', [
    {
      path: ORDER_PATH,
      selector: 'order.shortageLink',
      demo: 'SEED',
      title: '여기를 클릭 — 부족 품목에서 바로 발주로',
      body: '부족한 품목은 화면에서 바로 발주로 연결됩니다. 발주 생성 화면은 이 링크로만 열립니다.',
    },
    {
      path: ISSUE_PATH,
      selector: 'issue.header',
      demo: 'SEED',
      title: '출처 주문이 따라옵니다',
      body: `${DEMO_ORDER} 의 부족분에서 넘어왔습니다. 이 문서가 어떤 주문 때문에 생겼는지 추적할 수 있게 합니다.`,
    },
    {
      path: ISSUE_PATH,
      selector: 'issue.facts',
      demo: 'SEED',
      title: '자동으로 채워지는 값',
      body: '품목 · 부족수량 · 입고창고 · 출처 주문이 자동 입력됩니다. 문서 종류는 매입품이면 구매발주, 생산품이면 생산의뢰로 시스템이 결정합니다.',
    },
    {
      path: ISSUE_PATH,
      selector: 'issue.fields',
      demo: 'SEED',
      title: '담당자가 채우는 세 칸',
      body: '수량 · 공급처 · 사용가능예정일뿐입니다.',
    },
    {
      path: ISSUE_PATH,
      selector: 'issue.notice',
      demo: 'SEED',
      title: '발주를 생성해도 재고는 늘지 않습니다',
      body: '실제 입고가 완료되었을 때 현재고가 증가합니다.',
    },
    {
      path: ISSUE_PATH,
      selector: 'issue.submit',
      demo: 'ISSUED',
      press: true,
      title: '발주 생성 — 반복 요청은 멱등 처리',
      body: '같은 부족분으로 발주를 반복 요청해도 요청 ID 를 기준으로 문서가 한 건만 만들어집니다. 방금 만들어진 문서를 발주 현황에서 확인합니다.',
    },
  ]),

  // ── 09 SCR-03 발주 › 발주 현황 ───────────────────────────────────────
  // 26줄짜리 목록에서 "이 문서를 보세요" 를 표 전체 강조로는 말할 수 없다. 행마다 붙은
  // 앵커(purchase.row.*)로 그 성격의 줄들만 짚는다 — 순번이 곧 확인할 순서다.
  ...slide(9, 'SCR-03 · 발주 현황', [
    {
      path: '/inbound',
      selector: 'purchase.list',
      demo: 'ISSUED',
      title: '기존 문서와 한 목록에서',
      body: '계획수량 · 입고수량 · 잔여수량 · 사용가능예정일 · 진행상태를 확인할 수 있습니다. 목록은 처리할 것부터 위로 옵니다.',
    },
    {
      path: '/inbound',
      selector: 'purchase.row.related',
      demo: 'ISSUED',
      title: '방금 들어온 데이터',
      body: `직전 화면에서 만든 문서입니다. '${DEMO_ORDER} 부족분' 처럼 출처 주문이 붙어, 나중에 입고됐을 때 이 재고가 어떤 주문의 부족을 해결하기 위한 것이었는지 추적할 수 있습니다.`,
    },
    {
      path: '/inbound',
      selector: 'purchase.row.inspect',
      demo: 'ISSUED',
      title: '① 먼저 볼 것 — 검사 대기',
      body: '생산의뢰는 검사를 통과해야 현재고가 됩니다. 이 줄들이 지금 손을 대야 하는 문서입니다.',
    },
    {
      path: '/inbound',
      selector: 'purchase.row.arrived',
      demo: 'ISSUED',
      title: '② 다음 — 도착했는데 잔여가 남은 문서',
      body: '도착일이 지났고 아직 입고되지 않은 물량입니다. 바로 입고를 누를 수 있습니다.',
    },
    {
      path: '/inbound',
      selector: 'purchase.row.draft',
      demo: 'ISSUED',
      title: '③ 미확정 — 확정만 할 수 있습니다',
      body: '입고예정으로 세지 않기 때문에 검사도 입고도 시작할 수 없습니다. 발주 확정을 먼저 눌러야 판정에 들어옵니다.',
    },
    {
      path: '/inbound',
      selector: 'purchase.row.scheduled',
      demo: 'ISSUED',
      title: '기다리면 되는 문서',
      body: '아직 도착일이 오지 않았습니다. 확정되어 있으므로 입고예정으로는 이미 세고 있습니다.',
    },
    {
      path: '/inbound',
      selector: 'purchase.list',
      demo: 'ISSUED',
      title: '단계가 곧 다음 행동',
      body: '진행상태 7가지를 그대로 늘어놓으면 어느 쪽에 손을 대야 하는지 알 수 없어, 다음 행동으로 묶은 단계를 따로 두고 그 순서로 정렬했습니다. 구매발주는 입고, 생산의뢰는 검사 및 입고입니다.',
    },
  ]),

  // ── 10 SCR-03-2 검사 및 입고 모달 — 생산의뢰 ─────────────────────────
  ...slide(10, 'SCR-03-2 · 검사 및 입고 (생산의뢰)', [
    {
      path: PRODUCTION_PATH,
      selector: 'receive.inspection',
      demo: 'ISSUED',
      title: '생산품은 검사를 먼저',
      body: '생산된 제품이 실제 재고로 들어오기 전에 품질검사를 거쳐야 합니다. 그래서 검사와 입고를 하나의 흐름으로 묶었습니다.',
    },
    {
      path: PRODUCTION_PATH,
      selector: 'receive.receiving',
      demo: 'ISSUED',
      title: '합격 수량만 재고에 반영',
      body: '계획 수량 2개가 모두 합격하면 현재고가 2개 증가하고, 1개만 합격하면 합격한 1개만 반영됩니다.',
    },
    {
      path: PRODUCTION_PATH,
      selector: 'receive.receiving',
      demo: 'ISSUED',
      title: '시리얼도 합격 수량만큼',
      body: '시리얼 관리 품목은 합격 수량만큼 시리얼을 생성합니다.',
    },
    {
      path: PRODUCTION_PATH,
      selector: 'receive.submit',
      demo: 'PRODUCTION_RECEIVED',
      press: true,
      title: '검사 기록 후 입고 — 남은 수량이 0이 됩니다',
      body: '검사 → 합격분 입고 → 주문 재판정 순으로 처리됩니다. 계획 2개가 전량 합격해 남은 수량이 0으로 바뀌었습니다.',
    },
  ]),

  // ── 11 SCR-03-3 입고 처리 모달 — 구매발주 · 부분 입고 ────────────────
  ...slide(11, 'SCR-03-3 · 입고 처리 (구매발주 · 부분 입고)', [
    {
      path: PURCHASE_PATH,
      selector: 'receive.facts',
      demo: 'PRODUCTION_RECEIVED',
      title: '구매발주는 검사 없이 입고 수량만',
      body: '계획 3개 중 1개가 이미 입고됐다면 남은 2개까지만 추가 입고할 수 있습니다.',
    },
    {
      path: PURCHASE_PATH,
      selector: 'receive.receiving',
      demo: 'PRODUCTION_RECEIVED',
      title: '부분 입고는 허용, 초과는 거부',
      body: '계획 수량을 초과한 입고는 막았습니다.',
    },
    {
      path: PURCHASE_PATH,
      selector: 'receive.submit',
      demo: 'PURCHASE_RECEIVED',
      press: true,
      title: '입고 처리 — 현재고 증가 → 주문 재판정',
      body: '현재고가 증가하고, 해당 재고를 기다리던 주문을 다시 판정합니다. 남은 2개와 방금 만든 발주까지 입고했습니다.',
    },
  ]),

  // ── 12 SCR-03-4 발주 현황 — 입고 이력 · 주문 재판정 ──────────────────
  ...slide(12, 'SCR-03-4 · 입고 이력 · 주문 재판정', [
    {
      path: '/inbound',
      selector: 'purchase.history',
      demo: 'PURCHASE_RECEIVED',
      title: '입고 결과는 입고 이력에',
      body: '입고수량과 입고 후 현재고뿐 아니라, 이 입고로 어떤 주문이 준비 가능해졌는지도 기록합니다.',
    },
    {
      path: '/inbound',
      selector: 'purchase.history',
      demo: 'PURCHASE_RECEIVED',
      title: '입고 → 재고 변경 → 주문 재판정',
      body: `프레임이 입고되어, 기존에 재고 부족이었던 ${DEMO_ORDER} 가 바로 준비 가능한 상태로 변경됩니다. 클릭하면 그 주문 상세로 갑니다.`,
    },
    {
      path: '/inbound',
      selector: 'purchase.history',
      demo: 'PURCHASE_RECEIVED',
      title: '화면이 여러 개여도 숫자는 하나',
      body: '입고 후 현재고는 품목 상세 패널의 재고 이력 잔액과 같은 값으로 관리해 정합성을 유지합니다.',
    },
  ]),

  // ── 13 SCR-02-1 주문 상세 — 예약 완료 → 출고 ─────────────────────────
  // 예약과 출고는 버튼을 눌러야 결과가 생기는 자리다. 강조 → 클릭 표시 → 결과 순으로
  // 보여주기 위해, 버튼을 가리키는 스텝과 그 결과를 짚는 스텝을 나눠 두었다.
  ...slide(13, 'SCR-02-1 · 예약 완료 → 출고', [
    {
      path: ORDER_PATH,
      selector: 'order.stepsBar',
      demo: 'PURCHASE_RECEIVED',
      title: '입고 후 다시 판정된 주문',
      body: '재고 부족에서 바로 준비 가능으로 바뀌었습니다. 판정 결과를 저장하지 않고 매번 다시 계산하기 때문입니다.',
    },
    {
      path: ORDER_PATH,
      selector: 'order.itemTable',
      demo: 'PURCHASE_RECEIVED',
      title: '준비 품목 — 부족 0',
      body: '입고로 늘어난 재고가 가용재고가 되어 모든 준비 품목이 확보되었습니다.',
    },
    {
      path: ORDER_PATH,
      selector: 'order.nextAction',
      demo: 'RESERVED',
      press: true,
      title: '예약 — 전부 아니면 전무',
      body: '예약할 때 최신 재고를 다시 확인하고, 여러 품목 중 하나라도 부족하면 일부만 예약하지 않습니다.',
    },
    {
      path: ORDER_PATH,
      selector: 'order.serialTable',
      demo: 'RESERVED',
      title: '배정된 개체',
      body: '예약이 완료되면 현재고는 그대로이고 예약수량만 증가합니다. 시리얼 품목은 실제 개체를 주문에 배정합니다.',
    },
    {
      path: ORDER_PATH,
      selector: 'order.nextAction',
      demo: 'SHIPPED',
      press: true,
      title: '출고 — 실제 재고를 차감하는 마지막 단계',
      body: '현재고와 예약수량을 함께 차감하고 시리얼 상태를 출고 완료로 변경합니다. 처리를 마친 주문은 준비 대상에서 빠집니다.',
    },
    {
      // 출고한 주문의 상세는 '준비 대상 주문이 아닙니다' 로 바뀌어 강조할 자리가 없다 —
      // 빠졌다는 사실은 그 주문이 사라진 목록에서 보여주는 편이 맞다.
      path: '/orders',
      selector: 'prep.filter',
      demo: 'SHIPPED',
      title: '출고 완료 주문은 목록에서 빠집니다',
      body: '새로 준비할 대상이 아니므로 기본 목록에서 제외되고, 제외 주문 포함으로만 조회됩니다.',
    },
    {
      path: DEMO_ITEM_PATH,
      selector: 'items.drawer.movements',
      demo: 'SHIPPED',
      title: '품목 상세로 돌아와 검산',
      body: '입고로 늘고, 예약은 현재고를 건드리지 않고, 출고로 줄어든 흐름이 한 줄씩 남았습니다. 슬라이드 5에서 비어 있던 그 화면입니다.',
    },
  ]),

  // ── 14 SCR-02-1 주문 상세 — 확인 필요 ────────────────────────────────
  // 이 주문은 미등록 품목 때문에 막혀 있어 시연 상태와 무관하다 — 그대로 보여준다.
  ...slide(14, 'SCR-02-1 · 확인 필요', [
    {
      path: `/orders/${EXCEPTION_ORDER}`,
      selector: 'order.header',
      title: '모든 데이터가 정상으로 들어오지는 않습니다',
      body: '등록되지 않은 품목, 사용 중지된 창고, 수량이 0 이하인 주문은 확인 필요 상태로 표시합니다.',
    },
    {
      path: `/orders/${EXCEPTION_ORDER}`,
      selector: 'order.blocks',
      title: '무엇을 해결해야 하는지 사유로',
      body: '담당자가 어떤 문제를 해결해야 하는지 사유로 그대로 보여줍니다.',
    },
    {
      path: `/orders/${EXCEPTION_ORDER}`,
      selector: 'order.itemTable',
      title: '임의로 대체하지 않습니다',
      body: '다른 품목이나 창고로 바꾸거나 일부 품목만 예약하지 않습니다. 재고 변경도, 발주 생성도 없습니다.',
    },
    {
      path: `/orders/${EXCEPTION_ORDER}`,
      selector: 'order.stepsBar',
      title: '자동으로 다음 단계로 넘어가지 않습니다',
      body: '앞의 정상 흐름과 달리, 담당자의 확인을 먼저 받도록 했습니다.',
    },
  ]),

  // ── 15 자동화 테스트 · 검증 ──────────────────────────────────────────
  ...slide(15, '자동화 테스트 · 검증', [
    {
      title: '업무 규칙이 코드에서도 동작하는지',
      body: 'Vitest 로 재고 계산 · 예약 · 발주 · 입고 같은 핵심 업무 규칙을 검증했습니다. 전체 424개 중 업무 규칙 테스트가 255개입니다.',
    },
    {
      title: '무엇을 검증했나',
      body: '가용재고와 부족수량 계산, 세트 전개, 주문 배정 순서, 전부 아니면 전무 방식의 예약, 계획 수량을 초과한 입고 거부, 같은 요청의 중복 처리 방지.',
    },
    {
      title: '실제 서비스라면',
      body: 'Playwright 를 추가해 주문부터 출고까지의 E2E 시나리오도 검증할 수 있습니다.',
    },
  ]),

  // ── 16 마무리 ────────────────────────────────────────────────────────
  ...slide(16, '마무리', [
    {
      title: '핵심 한 줄',
      body: '화면을 많이 만드는 것이 아니라, 실제 업무 규칙을 화면과 코드에 정확하게 연결하는 것을 가장 중요하게 봤습니다.',
    },
    {
      title: '감사합니다',
      body: '주문에서 시작해 재고를 확인하고, 부족하면 발주하고, 입고 후 다시 판정해서 예약과 출고까지 — 이 흐름을 화면과 코드로 연결했습니다.',
    },
  ]),
]
