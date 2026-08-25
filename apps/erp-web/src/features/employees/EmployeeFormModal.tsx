import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Button, Field, Input, Modal, Select, useToast } from '@erp/design-system'
import { EMPLOYEE_STATUS } from '@/shared/lib/constants'
import type { Employee, EmployeeDraft, EmployeeStatus } from '@/types/domain'
import { useEmployeeStore } from './store'

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};

  ${({ theme }) => theme.media.maxSm} {
    grid-template-columns: 1fr;
  }
`

const FullRow = styled.div`
  grid-column: 1 / -1;
`

const POSITIONS = ['사원', '주임', '대리', '과장', '차장', '부장'].map((value) => ({
  label: value,
  value,
}))

const STATUS_OPTIONS = Object.values(EMPLOYEE_STATUS).map((meta) => ({
  label: meta.label,
  value: meta.value,
}))

const EMPTY: EmployeeDraft = {
  name: '',
  email: '',
  phone: '',
  department: '',
  position: '사원',
  status: 'active',
  hiredAt: new Date().toISOString().slice(0, 10),
  salary: 0,
}

export interface EmployeeFormModalProps {
  open: boolean
  onClose: () => void
  /** 있으면 수정 모드 */
  employee?: Employee | null
}

export function EmployeeFormModal({ open, onClose, employee }: EmployeeFormModalProps) {
  const toast = useToast()
  const departments = useEmployeeStore((state) => state.departments)
  const saving = useEmployeeStore((state) => state.saving)
  const fieldErrors = useEmployeeStore((state) => state.fieldErrors)
  const create = useEmployeeStore((state) => state.create)
  const update = useEmployeeStore((state) => state.update)
  const clearErrors = useEmployeeStore((state) => state.clearErrors)

  // 부모가 열 때마다 key 를 바꿔 새로 마운트하므로 초기값은 여기서 한 번만 계산하면 된다
  const [form, setForm] = useState<EmployeeDraft>(() => (employee ? { ...employee } : EMPTY))

  // 이전에 남은 검증 오류 제거 (스토어 = 외부 상태이므로 effect 가 맞다)
  useEffect(() => {
    clearErrors()
  }, [clearErrors])

  const set = <K extends keyof EmployeeDraft>(key: K, value: EmployeeDraft[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    const ok = employee ? await update(employee.id, form) : await create(form)

    if (ok) {
      toast.success(employee ? '사원 정보를 수정했습니다.' : '사원을 등록했습니다.', form.name)
      onClose()
    } else {
      toast.error('저장하지 못했습니다.', '입력값을 확인해 주세요.')
    }
  }

  const departmentOptions = (
    departments.length > 0 ? departments : ['경영지원', '영업', '개발', '생산']
  ).map((value) => ({ label: value, value }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={employee ? '사원 정보 수정' : '사원 등록'}
      description="필수 항목(*)을 입력한 뒤 저장하세요."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            취소
          </Button>
          <Button onClick={() => void handleSubmit()} loading={saving}>
            저장
          </Button>
        </>
      }
    >
      <Grid>
        <Field label="사원명" required error={fieldErrors.name}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={form.name}
              placeholder="홍길동"
              onChange={(event) => set('name', event.target.value)}
            />
          )}
        </Field>

        <Field label="부서" required error={fieldErrors.department}>
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              options={departmentOptions}
              placeholder="부서 선택"
              value={form.department}
              onChange={(event) => set('department', event.target.value)}
            />
          )}
        </Field>

        <Field label="직급">
          {({ id }) => (
            <Select
              id={id}
              options={POSITIONS}
              value={form.position}
              onChange={(event) => set('position', event.target.value)}
            />
          )}
        </Field>

        <Field label="재직 상태">
          {({ id }) => (
            <Select
              id={id}
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(event) => set('status', event.target.value as EmployeeStatus)}
            />
          )}
        </Field>

        <Field label="이메일" error={fieldErrors.email}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="email"
              aria-describedby={describedBy}
              invalid={invalid}
              value={form.email}
              placeholder="name@company.com"
              onChange={(event) => set('email', event.target.value)}
            />
          )}
        </Field>

        <Field label="연락처">
          {({ id }) => (
            <Input
              id={id}
              value={form.phone}
              placeholder="010-0000-0000"
              onChange={(event) => set('phone', event.target.value)}
            />
          )}
        </Field>

        <Field label="입사일">
          {({ id }) => (
            <Input
              id={id}
              type="date"
              value={form.hiredAt}
              onChange={(event) => set('hiredAt', event.target.value)}
            />
          )}
        </Field>

        <Field label="연봉" hint="원 단위로 입력합니다.">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              inputMode="numeric"
              suffix="원"
              value={form.salary === 0 ? '' : String(form.salary)}
              placeholder="0"
              onChange={(event) =>
                set('salary', Number(event.target.value.replace(/\D/g, '')) || 0)
              }
            />
          )}
        </Field>

        <FullRow />
      </Grid>
    </Modal>
  )
}
