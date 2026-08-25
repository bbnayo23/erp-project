import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field } from './Field'
import { Input, Textarea } from './Input'
import { Select } from './Select'
import { Checkbox, Radio } from './Checkbox'
import { Button } from './Button'
import { HStack, VStack } from './Stack'

const meta: Meta = {
  title: 'Components/Form',
}
export default meta

const DEPARTMENTS = [
  { label: '경영지원', value: 'management' },
  { label: '영업', value: 'sales' },
  { label: '개발', value: 'engineering' },
  { label: '생산', value: 'production' },
]

export const Inputs: StoryObj = {
  render: () => (
    <VStack gap={4} style={{ maxWidth: 420 }}>
      <Field label="사원명" required hint="주민등록상 이름을 입력하세요.">
        {({ id, describedBy }) => (
          <Input id={id} aria-describedby={describedBy} placeholder="홍길동" />
        )}
      </Field>

      <Field label="사번" error="이미 등록된 사번입니다.">
        {({ id, describedBy, invalid }) => (
          <Input id={id} aria-describedby={describedBy} invalid={invalid} defaultValue="EMP-0001" />
        )}
      </Field>

      <Field label="연봉" hint="원 단위로 입력합니다.">
        {({ id }) => <Input id={id} prefix="₩" suffix="원" inputMode="numeric" placeholder="0" />}
      </Field>

      <Field label="비고">{({ id }) => <Textarea id={id} placeholder="메모를 입력하세요" />}</Field>

      <Field label="읽기 전용">
        {({ id }) => <Input id={id} readOnly value="2026-08-25 자동 생성" />}
      </Field>

      <Field label="비활성">{({ id }) => <Input id={id} disabled value="수정 불가" />}</Field>
    </VStack>
  ),
}

export const Sizes: StoryObj = {
  render: () => (
    <VStack gap={3} style={{ maxWidth: 320 }}>
      <Input inputSize="sm" placeholder="small" />
      <Input inputSize="md" placeholder="medium" />
      <Input inputSize="lg" placeholder="large" />
      <Select selectSize="sm" options={DEPARTMENTS} placeholder="부서 선택" defaultValue="" />
      <Select selectSize="md" options={DEPARTMENTS} placeholder="부서 선택" defaultValue="" />
      <Select selectSize="lg" options={DEPARTMENTS} placeholder="부서 선택" defaultValue="" />
    </VStack>
  ),
}

export const Choices: StoryObj = {
  render: function Render() {
    const [checked, setChecked] = useState(true)
    const [plan, setPlan] = useState('monthly')

    return (
      <VStack gap={4}>
        <VStack gap={2}>
          <Checkbox
            label="재직 중인 사원만 표시"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
          />
          <Checkbox label="부분 선택 상태" indeterminate />
          <Checkbox label="비활성" disabled />
          <Checkbox label="비활성 + 체크됨" disabled defaultChecked />
        </VStack>

        <VStack gap={2}>
          <Radio
            name="plan"
            label="월 단위 정산"
            value="monthly"
            checked={plan === 'monthly'}
            onChange={(event) => setPlan(event.target.value)}
          />
          <Radio
            name="plan"
            label="분기 단위 정산"
            value="quarterly"
            checked={plan === 'quarterly'}
            onChange={(event) => setPlan(event.target.value)}
          />
          <Radio name="plan" label="비활성" value="none" disabled />
        </VStack>
      </VStack>
    )
  },
}

export const FormLayout: StoryObj = {
  render: () => (
    <VStack gap={4} style={{ maxWidth: 480 }}>
      <HStack gap={3}>
        <Field label="사원명" required>
          {({ id }) => <Input id={id} placeholder="홍길동" />}
        </Field>
        <Field label="부서" required>
          {({ id }) => <Select id={id} options={DEPARTMENTS} placeholder="선택" defaultValue="" />}
        </Field>
      </HStack>

      <Field label="이메일">
        {({ id }) => <Input id={id} type="email" placeholder="name@company.com" />}
      </Field>

      <HStack gap={2} justify="flex-end">
        <Button variant="secondary">취소</Button>
        <Button>저장</Button>
      </HStack>
    </VStack>
  ),
}
