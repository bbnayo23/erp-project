import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { Modal } from '@/components/common/Modal'
import { TextInput } from '@/components/common/TextInput'
import {
  Body,
  Facts,
  Field,
  Notice,
  Problem,
  Row,
  Section,
  SerialList,
  StepHint,
  StepTitle,
} from './styled'
import type { ReceiptDraft, ReceiveModalProps } from './types'

/**
 * 입고 처리 모달.
 *
 * 문서구분이 화면 구성을 정한다.
 *   구매발주 — 수량과 개체번호만 확인하고 바로 입고
 *   생산의뢰 — ① 품질검사 결과를 먼저 기록해야 ② 입고로 갈 수 있다
 *
 * 검사 단계를 앞에 세운 것은 규칙이다. 검사를 통과하지 않은 물량은 창고에 들어와도
 * 팔 수 있는 재고가 아니다 — 순서를 화면이 강제하지 않으면 담당자가 건너뛴다.
 *
 * 개체번호는 자동으로 채워지지만 고칠 수 있다. 실물 라벨과 번호가 다르면 이후 피킹에서
 * 어느 개체를 집어야 하는지 알 수 없어진다.
 *
 * 부모가 문서번호를 `key` 로 준다. 문서가 바뀌면 컴포넌트가 새로 마운트되어 입력이 그
 * 문서 기준으로 다시 채워진다 — effect 로 초기화하면 한 번 그린 뒤 다시 그리는 연쇄
 * 렌더가 되고, 앞서 연 문서의 수량이 한 프레임 동안 남는다.
 */
export function ReceiveModal({
  row,
  suggestedSerials,
  serialManaged,
  onClose,
  onSubmit,
}: ReceiveModalProps) {
  const production = row?.documentType === '생산'

  const [quantity, setQuantity] = useState(String(row?.remainingQuantity ?? 0))
  const [serials, setSerials] = useState<string[]>(suggestedSerials)
  const [failed, setFailed] = useState('0')
  const [note, setNote] = useState('')

  if (!row) return null

  const remaining = row.remainingQuantity
  const failedCount = Number(failed) || 0
  /** 생산의뢰는 합격수량이 곧 입고수량이다 — 불합격분은 들어오지 않는다 */
  const receiving = production ? remaining - failedCount : Number(quantity) || 0

  const problem = (() => {
    if (production) {
      if (failedCount < 0 || failedCount > remaining) {
        return `불합격 수량은 0에서 ${remaining} 사이여야 합니다.`
      }
      return undefined
    }
    if (receiving <= 0) return '입고 수량은 1개 이상이어야 합니다.'
    if (receiving > remaining) return `남은수량 ${remaining}개를 넘을 수 없습니다.`
    return undefined
  })()

  const units = serialManaged ? serials.slice(0, receiving) : []
  const blankUnit = units.some((serial) => serial.trim() === '')
  const duplicated = new Set(units).size !== units.length

  const submit = () => {
    const draft: ReceiptDraft = {
      quantity: receiving,
      serialNumbers: units,
      ...(production
        ? {
            inspection: {
              passedQuantity: receiving,
              failedQuantity: failedCount,
              note: note.trim(),
            },
          }
        : {}),
    }
    onSubmit(draft)
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={production ? '검사 및 입고' : '입고 처리'}
      description={`${row.documentId} · ${row.itemName}`}
      footer={
        <Row>
          <Button variant="secondary" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Icon name="inbound" size={13} />}
            disabled={Boolean(problem) || blankUnit || duplicated || receiving <= 0}
            onClick={submit}
          >
            {production ? '검사 기록 후 입고' : '입고 처리'}
          </Button>
        </Row>
      }
    >
      <Body>
        <Facts>
          <div>
            <dt>입고창고</dt>
            <dd>{row.warehouseName}</dd>
          </div>
          <div>
            <dt>계획</dt>
            <dd>{row.plannedQuantity}</dd>
          </div>
          <div>
            <dt>기존 입고</dt>
            <dd>{row.receivedQuantity}</dd>
          </div>
          <div>
            <dt>남은</dt>
            <dd>{remaining}</dd>
          </div>
        </Facts>

        {production && (
          <Section>
            <StepTitle>① 품질검사 결과</StepTitle>
            <StepHint>
              합격한 수량만 현재고가 됩니다. 불합격 수량만큼 계획수량이 줄어 앞으로도 들어오지
              않습니다.
            </StepHint>
            <Row>
              <Field>
                불합격 수량
                <TextInput
                  numeric
                  aria-label="불합격 수량"
                  value={failed}
                  onChange={(event) => setFailed(event.target.value)}
                />
              </Field>
              <Field>
                합격 수량
                <TextInput numeric aria-label="합격 수량" value={String(receiving)} readOnly />
              </Field>
            </Row>
            <TextInput
              aria-label="검사 비고"
              placeholder="비고 (불합격 사유 등)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Section>
        )}

        <Section>
          <StepTitle>{production ? '② 입고' : '입고 수량'}</StepTitle>
          {production ? (
            <StepHint>합격수량 {receiving}개가 입고됩니다.</StepHint>
          ) : (
            <Field>
              수량
              <TextInput
                numeric
                aria-label="입고 수량"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
              <StepHint>최대 {remaining}</StepHint>
            </Field>
          )}

          {serialManaged && receiving > 0 && (
            <>
              <StepHint>
                시리얼 관리 품목입니다. {receiving}건의 개체가 생성됩니다 — 실물 라벨과 다르면 고쳐
                주세요.
              </StepHint>
              <SerialList>
                {units.map((serial, index) => (
                  <li key={index}>
                    <TextInput
                      aria-label={`시리얼번호 ${index + 1}`}
                      value={serial}
                      onChange={(event) =>
                        setSerials((previous) =>
                          previous.map((value, at) => (at === index ? event.target.value : value)),
                        )
                      }
                    />
                  </li>
                ))}
              </SerialList>
            </>
          )}
        </Section>

        {problem && <Problem role="alert">{problem}</Problem>}
        {blankUnit && <Problem role="alert">시리얼번호를 모두 입력해 주세요.</Problem>}
        {duplicated && <Problem role="alert">시리얼번호가 중복됩니다.</Problem>}

        <Notice>입고 처리를 해야 현재고가 늘어납니다.</Notice>
      </Body>
    </Modal>
  )
}
