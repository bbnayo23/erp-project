import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'
import { Card, CardBody, CardFooter, CardHeader } from './Card'
import { EmptyState } from './EmptyState'
import { Table, type TableColumn } from './Table'
import { Pagination } from './Pagination'
import { Tabs } from './Tabs'
import { Button } from './Button'
import { HStack, VStack } from './Stack'
import { Text } from './Text'

const meta: Meta = {
  title: 'Components/Data Display',
}
export default meta

interface DemoRow {
  id: string
  code: string
  name: string
  department: string
  status: 'active' | 'leave' | 'resigned'
  salary: number
}

const ROWS: DemoRow[] = [
  {
    id: '1',
    code: 'EMP-0001',
    name: '김서연',
    department: '경영지원',
    status: 'active',
    salary: 52000000,
  },
  {
    id: '2',
    code: 'EMP-0002',
    name: '박지훈',
    department: '영업',
    status: 'active',
    salary: 61000000,
  },
  {
    id: '3',
    code: 'EMP-0003',
    name: '이하늘',
    department: '개발',
    status: 'leave',
    salary: 74000000,
  },
  {
    id: '4',
    code: 'EMP-0004',
    name: '정민재',
    department: '생산',
    status: 'resigned',
    salary: 48000000,
  },
]

const STATUS_META = {
  active: { label: '재직', tone: 'success' },
  leave: { label: '휴직', tone: 'warning' },
  resigned: { label: '퇴사', tone: 'neutral' },
} as const

const columns: TableColumn<DemoRow>[] = [
  { key: 'code', header: '사번', width: '120px' },
  { key: 'name', header: '사원명' },
  { key: 'department', header: '부서' },
  {
    key: 'status',
    header: '상태',
    width: '100px',
    render: (row) => (
      <Badge tone={STATUS_META[row.status].tone} dot>
        {STATUS_META[row.status].label}
      </Badge>
    ),
  },
  {
    key: 'salary',
    header: '연봉',
    numeric: true,
    render: (row) => `${row.salary.toLocaleString('ko-KR')}원`,
  },
]

export const Badges: StoryObj = {
  render: () => (
    <VStack gap={4}>
      {(['subtle', 'solid', 'outline'] as const).map((variant) => (
        <HStack key={variant} gap={2} align="center" wrap>
          <Text variant="caption" color="textSubtle" style={{ minWidth: 60 }}>
            {variant}
          </Text>
          {(['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const).map((tone) => (
            <Badge key={tone} tone={tone} variant={variant} dot>
              {tone}
            </Badge>
          ))}
        </HStack>
      ))}
    </VStack>
  ),
}

export const Cards: StoryObj = {
  render: () => (
    <HStack gap={4} wrap align="flex-start">
      <Card padding="md" style={{ width: 280 }}>
        <Text variant="caption" color="textMuted">
          이번 달 매출
        </Text>
        <Text variant="h1" numeric style={{ display: 'block', marginTop: 4 }}>
          ₩ 128,400,000
        </Text>
        <Badge tone="success" variant="subtle" size="sm" style={{ marginTop: 8 }}>
          +12.4%
        </Badge>
      </Card>

      <Card padding="none" style={{ width: 380 }}>
        <CardHeader
          title="미결 전표"
          description="승인 대기 중인 항목"
          actions={
            <Button size="sm" variant="secondary">
              전체 보기
            </Button>
          }
        />
        <CardBody>
          <Text color="textMuted">승인 대기 8건, 반려 2건</Text>
        </CardBody>
        <CardFooter>
          <Button size="sm" variant="ghost">
            나중에
          </Button>
          <Button size="sm">일괄 승인</Button>
        </CardFooter>
      </Card>
    </HStack>
  ),
}

export const DataTable: StoryObj = {
  render: function Render() {
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    return (
      <Card padding="none">
        <CardHeader title="사원 목록" description="총 4건" />
        <Table columns={columns} data={ROWS} rowKey={(row) => row.id} onRowClick={() => {}} />
        <Pagination
          page={page}
          pageSize={pageSize}
          total={137}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      </Card>
    )
  },
}

export const TableStates: StoryObj = {
  render: () => (
    <VStack gap={6}>
      <Card padding="none">
        <Table columns={columns} data={[]} rowKey={(row) => row.id} loading />
      </Card>
      <Card padding="none">
        <Table
          columns={columns}
          data={[]}
          rowKey={(row) => row.id}
          emptyTitle="등록된 사원이 없습니다"
          emptyDescription="신규 등록 버튼을 눌러 첫 사원을 추가해 보세요."
          emptyAction={<Button size="sm">신규 등록</Button>}
        />
      </Card>
    </VStack>
  ),
}

export const Empty: StoryObj = {
  render: () => (
    <Card padding="none">
      <EmptyState
        title="검색 결과가 없습니다"
        description="검색 조건을 변경하거나 필터를 초기화해 보세요."
        action={<Button variant="secondary">필터 초기화</Button>}
      />
    </Card>
  ),
}

export const TabsStory: StoryObj = {
  name: 'Tabs',
  render: () => (
    <VStack gap={8}>
      <Tabs
        items={[
          { value: 'all', label: '전체', count: 137 },
          { value: 'active', label: '재직', count: 121 },
          { value: 'leave', label: '휴직', count: 9 },
          { value: 'resigned', label: '퇴사', count: 7 },
        ]}
      >
        <Text color="textMuted">선택된 탭의 내용이 여기에 표시됩니다.</Text>
      </Tabs>

      <Tabs
        variant="pill"
        items={[
          { value: 'table', label: '표' },
          { value: 'chart', label: '차트' },
          { value: 'disabled', label: '비활성', disabled: true },
        ]}
      />
    </VStack>
  ),
}
