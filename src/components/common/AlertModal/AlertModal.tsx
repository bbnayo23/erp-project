import { useEffect, useRef } from 'react'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { Overlay, useOverlay } from '@/components/common/Overlay'
import { Actions, Description, Head, IconSlot, Panel, Title, TitleGroup } from './styled'
import type { AlertModalProps } from './types'

/**
 * 되돌릴 수 없는 일을 하기 전에 묻는 창.
 *
 * Modal 과 따로 두는 이유는 세 가지다.
 *   - 머리말에 닫기(×)가 없다. ×는 '아무 일도 없이 닫는다' 는 뜻인데, 이 창은 어느
 *     쪽이든 골라야 끝난다. 두 버튼만 남겨 선택을 강제한다.
 *   - 세모 느낌표를 제목 옆에 고정으로 세운다. 이 창이 떴다는 사실 자체가 경고다.
 *   - 진행 버튼이 danger 다. 오른쪽 끝은 손이 먼저 가는 자리라 색으로 한 번 잡는다.
 *
 * 딤 클릭과 ESC 는 취소로 본다 — 실수로 닫았을 때 잃는 쪽이 아니어야 한다.
 */
export const AlertModal = ({
  open,
  title,
  description,
  tone = 'danger',
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
}: AlertModalProps) => {
  const { panelRef } = useOverlay<HTMLDivElement>({ open, onClose: onCancel })
  const cancelRef = useRef<HTMLButtonElement>(null)

  /**
   * 포커스는 '머무르기' 에 둔다. Enter 를 눌러 창을 넘기려는 손이 값을 버리면 안 된다.
   */
  useEffect(() => {
    if (open) cancelRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <Overlay align="center" onDismiss={onCancel}>
      <Panel
        ref={panelRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        <Head>
          <IconSlot $tone={tone}>
            <Icon name="alert" size={20} />
          </IconSlot>
          <TitleGroup>
            <Title>{title}</Title>
            {description && <Description>{description}</Description>}
          </TitleGroup>
        </Head>

        <Actions>
          <Button ref={cancelRef} variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </Actions>
      </Panel>
    </Overlay>
  )
}
