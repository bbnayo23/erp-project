import { Button } from '@/components/common/Button'
import { Checkbox } from '@/components/common/Checkbox'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { Panel } from '@/components/common/Panel'
import { Select } from '@/components/common/Select'
import { TextInput } from '@/components/common/TextInput'
import { PageHeader } from '@/components/layout/PageHeader'
import { useIssuePage } from './hooks'
import { Actions, Facts, Field, Fixed, Form, Layout, Notice, Problem } from './styled'

/**
 * 발주 생성 (`/inbound/new`).
 *
 * 주문 상세의 부족 품목에서 넘어온다. 품목 · 창고 · 수량이 URL 로 미리 오므로 담당자가
 * 채우는 것은 세 가지뿐이다.
 *
 * **바꿀 수 없는 것을 입력으로 두지 않는다.** 문서구분은 품목유형이 정하고(매입품 →
 * 구매발주, 생산품 → 생산의뢰), 입고창고는 주문의 출고창고로 고정된다. 드롭다운을 열어
 * 고르게 하면 담당자가 규칙을 깨는 선택을 할 수 있는데, 그건 화면이 막아야 한다.
 */
export const IssuePage = () => {
  const { context, problem, draft, setDraft, supplierOptions, invalid, submit, cancel } =
    useIssuePage()

  const back = (
    <Button variant="ghost" size="sm" leftIcon={<Icon name="back" size={13} />} onClick={cancel}>
      취소
    </Button>
  )

  if (!context) {
    return (
      <Layout>
        <PageHeader title="발주 생성" actions={back} />
        <Panel>
          <EmptyState
            title="이 품목으로는 발주할 수 없습니다"
            description={problem ?? '품목과 창고를 확인해 주세요.'}
            action={back}
          />
        </Panel>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageHeader
        title="발주 생성"
        description={
          context.sourceOrderId
            ? `${context.sourceOrderId} 의 부족분에서 넘어왔습니다.`
            : '부족한 품목을 채웁니다.'
        }
        actions={back}
      />

      <Panel title="발주 내용" padded>
        <Form
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          {/* 규칙이 정한 값 — 담당자가 바꿀 수 없다 */}
          <Facts>
            <div>
              <dt>품목</dt>
              <dd>
                {context.itemName}
                <Fixed>
                  {context.itemCode} · {context.itemType}
                </Fixed>
              </dd>
            </div>
            <div>
              <dt>문서구분</dt>
              <dd>
                {context.documentTypeLabel}
                <Fixed>품목유형이 정합니다</Fixed>
              </dd>
            </div>
            <div>
              <dt>입고창고</dt>
              <dd>
                {context.warehouseName}
                <Fixed>주문의 출고창고로 고정</Fixed>
              </dd>
            </div>
          </Facts>

          <Field>
            <span>수량</span>
            <TextInput
              numeric
              aria-label="발주 수량"
              value={draft.quantity}
              onChange={(event) => setDraft({ quantity: event.target.value })}
            />
            {context.shortageQuantity > 0 && <Fixed>부족수량 {context.shortageQuantity}개</Fixed>}
          </Field>

          <Field>
            <span>공급처</span>
            <Select
              aria-label="공급처"
              options={supplierOptions}
              value={draft.supplierCode}
              onChange={(event) => setDraft({ supplierCode: event.target.value })}
            />
          </Field>

          <Field>
            <span>사용가능예정일</span>
            <TextInput
              type="date"
              aria-label="사용가능예정일"
              value={draft.availableDate}
              onChange={(event) => setDraft({ availableDate: event.target.value })}
            />
            <Fixed>기준시각 + 리드타임</Fixed>
          </Field>

          <Checkbox
            label="생성 즉시 발주 확정"
            checked={draft.confirmImmediately}
            onChange={(event) => setDraft({ confirmImmediately: event.target.checked })}
          />
          <Fixed>확정해야 판정에 쓰여 이 주문이 대기로 바뀝니다.</Fixed>

          <Notice>발주를 생성해도 현재고는 늘지 않습니다. 입고 처리를 해야 늘어납니다.</Notice>

          {invalid && <Problem role="alert">{invalid}</Problem>}

          <Actions>
            {back}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Icon name="plus" size={13} />}
              disabled={Boolean(invalid)}
            >
              발주 생성
            </Button>
          </Actions>
        </Form>
      </Panel>
    </Layout>
  )
}
