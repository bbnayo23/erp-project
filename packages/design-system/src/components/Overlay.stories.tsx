import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Modal } from './Modal'
import { Button } from './Button'
import { HStack, VStack } from './Stack'
import { Field } from './Field'
import { Input } from './Input'
import { Select } from './Select'
import { useToast } from './Toast'
import { Text } from './Text'

const meta: Meta = {
  title: 'Components/Overlay',
}
export default meta

export const ModalStory: StoryObj = {
  name: 'Modal',
  render: function Render() {
    const [open, setOpen] = useState(false)

    return (
      <>
        <Button onClick={() => setOpen(true)}>사원 등록 모달 열기</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="사원 등록"
          description="필수 항목(*)을 모두 입력해야 저장할 수 있습니다."
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button onClick={() => setOpen(false)}>저장</Button>
            </>
          }
        >
          <VStack gap={4}>
            <HStack gap={3}>
              <Field label="사원명" required>
                {({ id }) => <Input id={id} placeholder="홍길동" />}
              </Field>
              <Field label="부서" required>
                {({ id }) => (
                  <Select
                    id={id}
                    defaultValue=""
                    placeholder="선택"
                    options={[
                      { label: '경영지원', value: 'management' },
                      { label: '영업', value: 'sales' },
                      { label: '개발', value: 'engineering' },
                    ]}
                  />
                )}
              </Field>
            </HStack>
            <Field label="이메일">
              {({ id }) => <Input id={id} type="email" placeholder="name@company.com" />}
            </Field>
          </VStack>
        </Modal>
      </>
    )
  },
}

export const ConfirmModal: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false)

    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          삭제
        </Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          size="sm"
          title="선택한 항목을 삭제할까요?"
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                삭제
              </Button>
            </>
          }
        >
          <Text color="textMuted">삭제한 데이터는 복구할 수 없습니다.</Text>
        </Modal>
      </>
    )
  },
}

export const Toasts: StoryObj = {
  render: function Render() {
    const toast = useToast()

    return (
      <HStack gap={2} wrap>
        <Button variant="secondary" onClick={() => toast.show({ title: '정보 알림입니다.' })}>
          info
        </Button>
        <Button onClick={() => toast.success('저장되었습니다.', '사원 정보가 등록되었습니다.')}>
          success
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast.show({ title: '재고가 부족합니다.', tone: 'warning' })}
        >
          warning
        </Button>
        <Button
          variant="danger"
          onClick={() => toast.error('저장에 실패했습니다.', '잠시 후 다시 시도해 주세요.')}
        >
          danger
        </Button>
      </HStack>
    )
  },
}
