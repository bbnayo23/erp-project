import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { TextInput } from '@/components/common/TextInput'
import { formatDate } from '@/utils/date'
import { formatNumber } from '@/utils/number'
import { useReceiveForm } from './hooks'
import { ItemCode, ItemName, Meta, Remaining, Row, Rows } from './styled'
import type { ReceiveDialogProps, ReceiveModalProps } from './types'

/**
 * 발주가 바뀔 때마다 입력값을 새로 초기화해야 하는데, effect 로 동기화하면
 * 렌더가 연쇄된다. 대신 발주 id 를 key 로 주어 내부 폼을 새로 마운트한다.
 */
export function ReceiveModal({ purchaseOrder, onClose, onSubmit }: ReceiveModalProps) {
  if (!purchaseOrder) return null

  return (
    <ReceiveDialog
      key={purchaseOrder.id}
      purchaseOrder={purchaseOrder}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}

function ReceiveDialog({ purchaseOrder, onClose, onSubmit }: ReceiveDialogProps) {
  const { rows, quantities, setQuantity, receipts, hasQuantity } = useReceiveForm(purchaseOrder)

  return (
    <Modal
      open
      onClose={onClose}
      title={`${purchaseOrder.code} 입고`}
      description={purchaseOrder.supplier}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button disabled={!hasQuantity} onClick={() => onSubmit(receipts)}>
            입고 처리
          </Button>
        </>
      }
    >
      <Meta>
        입고예정일 {formatDate(purchaseOrder.expectedDate)} · 잔량을 넘는 수량은 처리되지 않습니다.
      </Meta>

      <Rows>
        {rows.map((row) => (
          <Row key={row.lineId}>
            <div>
              <ItemName>{row.itemName}</ItemName>
              <ItemCode>{row.itemCode}</ItemCode>
            </div>
            <Remaining>
              잔량 {formatNumber(row.remaining)} {row.unit}
            </Remaining>
            <TextInput
              numeric
              type="number"
              min={0}
              max={row.remaining}
              value={quantities[row.lineId] ?? 0}
              disabled={row.remaining === 0}
              onChange={(event) =>
                setQuantity(row.lineId, Number(event.target.value), row.remaining)
              }
              aria-label={`${row.itemName} 입고 수량`}
            />
          </Row>
        ))}
      </Rows>
    </Modal>
  )
}
