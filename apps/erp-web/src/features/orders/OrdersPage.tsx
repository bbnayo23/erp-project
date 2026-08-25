import { useEffect, useState } from 'react'
import { Badge, Card, Pagination, Table, Tabs, Text, type TableColumn } from '@erp/design-system'
import { apiClient, toErrorMessage } from '@/shared/api/client'
import type { PagedResponse } from '@/shared/api/types'
import { DEFAULT_PAGE_SIZE, ORDER_STATUS, PAGE_SIZE_OPTIONS } from '@/shared/lib/constants'
import { formatCurrency, formatDate, formatNumber } from '@/shared/lib/format'
import { ErrorBanner, PageHeader } from '@/shared/ui/PageHeader'
import type { Order, OrderStatus } from '@/types/domain'

const TAB_ITEMS = [
  { value: 'all', label: '전체' },
  ...Object.values(ORDER_STATUS).map((meta) => ({ value: meta.value, label: meta.label })),
]

const columns: TableColumn<Order>[] = [
  { key: 'orderNo', header: '주문번호', width: '140px' },
  {
    key: 'customer',
    header: '거래처',
    render: (row) => <Text variant="bodyStrong">{row.customer}</Text>,
  },
  { key: 'owner', header: '담당자', width: '100px' },
  {
    key: 'orderedAt',
    header: '수주일',
    width: '110px',
    render: (row) => formatDate(row.orderedAt),
  },
  { key: 'dueAt', header: '납기일', width: '110px', render: (row) => formatDate(row.dueAt) },
  {
    key: 'lines',
    header: '품목수',
    width: '80px',
    numeric: true,
    render: (row) => formatNumber(row.lines.length),
  },
  {
    key: 'totalAmount',
    header: '주문금액',
    width: '150px',
    numeric: true,
    render: (row) => formatCurrency(row.totalAmount),
  },
  {
    key: 'status',
    header: '상태',
    width: '90px',
    align: 'center',
    render: (row) => (
      <Badge tone={ORDER_STATUS[row.status].tone} size="sm" dot>
        {ORDER_STATUS[row.status].label}
      </Badge>
    ),
  },
]

/**
 * 수주관리는 zustand 스토어 없이 페이지 로컬 상태만 쓰는 예시.
 * 화면 밖에서 재사용될 일이 없는 목록이라면 이 정도로 충분하다.
 */
export function OrdersPage() {
  const [items, setItems] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 탭이나 페이지를 빠르게 바꾸면 먼저 보낸 요청이 나중에 도착해 최신 결과를 덮어쓸 수 있다
    let cancelled = false

    /* eslint-disable react-hooks/set-state-in-effect -- 쿼리 라이브러리 없이 직접 페치하는 페이지라 로딩 표시는 요청 시작 시점에 켜야 한다 */
    setLoading(true)
    setError(null)
    /* eslint-enable react-hooks/set-state-in-effect */

    void (async () => {
      try {
        const response = await apiClient.get<PagedResponse<Order>>('/orders', {
          query: { page, pageSize, status },
        })
        if (cancelled) return
        setItems(response.data)
        setTotal(response.meta.total)
      } catch (cause) {
        if (cancelled) return
        setError(toErrorMessage(cause))
        setItems([])
        setTotal(0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [page, pageSize, status])

  return (
    <>
      <PageHeader title="수주관리" description="거래처 수주 현황을 상태별로 조회합니다." />

      <Card padding="none">
        <div style={{ padding: '0 16px' }}>
          <Tabs
            items={TAB_ITEMS}
            value={status}
            onChange={(next) => {
              setStatus(next as OrderStatus | 'all')
              setPage(1)
            }}
          />
        </div>

        {error && <ErrorBanner role="alert">{error}</ErrorBanner>}

        <Table
          columns={columns}
          data={items}
          rowKey={(row) => row.id}
          loading={loading}
          emptyTitle="해당 상태의 수주가 없습니다"
        />

        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      </Card>
    </>
  )
}
