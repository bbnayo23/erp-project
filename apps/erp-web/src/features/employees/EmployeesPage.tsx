import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  IconButton,
  Input,
  Modal,
  Pagination,
  Select,
  Table,
  Text,
  useToast,
  type TableColumn,
} from '@erp/design-system'
import { EMPLOYEE_STATUS, PAGE_SIZE_OPTIONS } from '@/shared/lib/constants'
import { formatCurrency, formatDate } from '@/shared/lib/format'
import { ErrorBanner, FilterBar, PageHeader } from '@/shared/ui/PageHeader'
import type { Employee } from '@/types/domain'
import { EmployeeFormModal } from './EmployeeFormModal'
import { useEmployeeStore } from './store'

const STATUS_FILTER_OPTIONS = [
  { label: '전체 상태', value: 'all' },
  ...Object.values(EMPLOYEE_STATUS).map((meta) => ({ label: meta.label, value: meta.value })),
]

const PlusIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

const EditIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
    <path
      d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
    <path
      d="M4 6h12M8 6V4h4v2m-6 0v10h8V6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export function EmployeesPage() {
  const toast = useToast()
  const {
    items,
    departments,
    total,
    page,
    pageSize,
    filters,
    loading,
    error,
    fetch,
    fetchDepartments,
    setPage,
    setPageSize,
    setFilters,
    resetFilters,
    remove,
  } = useEmployeeStore()

  const [keywordInput, setKeywordInput] = useState(filters.keyword)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)

  useEffect(() => {
    void fetch()
    void fetchDepartments()
  }, [fetch, fetchDepartments])

  const departmentOptions = useMemo(
    () => [
      { label: '전체 부서', value: 'all' },
      ...departments.map((value) => ({ label: value, value })),
    ],
    [departments],
  )

  const columns = useMemo<TableColumn<Employee>[]>(
    () => [
      { key: 'code', header: '사번', width: '110px' },
      {
        key: 'name',
        header: '사원명',
        width: '120px',
        render: (row) => <Text variant="bodyStrong">{row.name}</Text>,
      },
      { key: 'department', header: '부서', width: '110px' },
      { key: 'position', header: '직급', width: '90px' },
      {
        key: 'email',
        header: '이메일',
        render: (row) => (
          <Text color="textMuted" truncate>
            {row.email}
          </Text>
        ),
      },
      { key: 'phone', header: '연락처', width: '140px' },
      {
        key: 'hiredAt',
        header: '입사일',
        width: '110px',
        render: (row) => formatDate(row.hiredAt),
      },
      {
        key: 'salary',
        header: '연봉',
        width: '130px',
        numeric: true,
        render: (row) => formatCurrency(row.salary),
      },
      {
        key: 'status',
        header: '상태',
        width: '90px',
        align: 'center',
        render: (row) => (
          <Badge tone={EMPLOYEE_STATUS[row.status].tone} size="sm" dot>
            {EMPLOYEE_STATUS[row.status].label}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: '',
        width: '84px',
        align: 'right',
        render: (row) => (
          <div style={{ display: 'inline-flex', gap: 4 }}>
            <IconButton
              aria-label={`${row.name} 수정`}
              size="sm"
              onClick={(event) => {
                event.stopPropagation()
                setEditing(row)
                setFormOpen(true)
              }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              aria-label={`${row.name} 삭제`}
              size="sm"
              onClick={(event) => {
                event.stopPropagation()
                setDeleteTarget(row)
              }}
            >
              <TrashIcon />
            </IconButton>
          </div>
        ),
      },
    ],
    [],
  )

  const handleDelete = async () => {
    if (!deleteTarget) return
    const ok = await remove(deleteTarget.id)
    if (ok) toast.success('삭제했습니다.', deleteTarget.name)
    else toast.error('삭제하지 못했습니다.')
    setDeleteTarget(null)
  }

  return (
    <>
      <PageHeader
        title="사원관리"
        description="사원 기준정보를 조회하고 등록·수정합니다."
        actions={
          <Button
            leftIcon={<PlusIcon />}
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            신규 등록
          </Button>
        }
      />

      <Card padding="none">
        <FilterBar>
          <form
            style={{ display: 'flex', gap: 8, flex: '1 1 280px', minWidth: 0 }}
            onSubmit={(event) => {
              event.preventDefault()
              setFilters({ keyword: keywordInput })
            }}
          >
            <Input
              placeholder="사번, 이름, 이메일 검색"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              aria-label="사원 검색"
            />
            <Button type="submit" variant="secondary">
              검색
            </Button>
          </form>

          <Select
            options={departmentOptions}
            value={filters.department}
            onChange={(event) => setFilters({ department: event.target.value })}
            aria-label="부서 필터"
            style={{ width: 160 }}
          />

          <Select
            options={STATUS_FILTER_OPTIONS}
            value={filters.status}
            onChange={(event) =>
              setFilters({ status: event.target.value as typeof filters.status })
            }
            aria-label="상태 필터"
            style={{ width: 140 }}
          />

          <Button
            variant="ghost"
            onClick={() => {
              setKeywordInput('')
              resetFilters()
            }}
          >
            초기화
          </Button>
        </FilterBar>

        {error && <ErrorBanner role="alert">{error}</ErrorBanner>}

        <Table
          columns={columns}
          data={items}
          rowKey={(row) => row.id}
          loading={loading}
          emptyTitle="조건에 맞는 사원이 없습니다"
          emptyDescription="검색어나 필터를 변경해 보세요."
          emptyAction={
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              필터 초기화
            </Button>
          }
          onRowClick={(row) => {
            setEditing(row)
            setFormOpen(true)
          }}
        />

        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* key + 조건부 마운트 → 열 때마다 폼 상태가 초기화된다 (Modal 은 닫힐 때 null 을 렌더하므로 동작 동일) */}
      {formOpen && (
        <EmployeeFormModal
          key={editing?.id ?? 'new'}
          open
          employee={editing}
          onClose={() => setFormOpen(false)}
        />
      )}

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        size="sm"
        title="사원을 삭제할까요?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button variant="danger" onClick={() => void handleDelete()}>
              삭제
            </Button>
          </>
        }
      >
        <Text color="textMuted">
          {deleteTarget?.name}({deleteTarget?.code}) 사원을 삭제합니다. 삭제한 데이터는 복구할 수
          없습니다.
        </Text>
      </Modal>
    </>
  )
}
