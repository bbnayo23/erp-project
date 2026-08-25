import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  Pagination,
  Select,
  Table,
  Text,
  type TableColumn,
} from '@erp/design-system'
import { PAGE_SIZE_OPTIONS, PRODUCT_STATUS } from '@/shared/lib/constants'
import { formatCurrency, formatDate, formatNumber } from '@/shared/lib/format'
import { ErrorBanner, FilterBar, PageHeader } from '@/shared/ui/PageHeader'
import type { Product } from '@/types/domain'
import { useProductStore } from './store'

const STATUS_FILTER_OPTIONS = [
  { label: '전체 상태', value: 'all' },
  ...Object.values(PRODUCT_STATUS).map((meta) => ({ label: meta.label, value: meta.value })),
]

export function ProductsPage() {
  const {
    items,
    categories,
    total,
    page,
    pageSize,
    filters,
    loading,
    error,
    fetch,
    fetchCategories,
    setPage,
    setPageSize,
    setFilters,
    resetFilters,
  } = useProductStore()

  const [keywordInput, setKeywordInput] = useState(filters.keyword)

  useEffect(() => {
    void fetch()
    void fetchCategories()
  }, [fetch, fetchCategories])

  const categoryOptions = useMemo(
    () => [
      { label: '전체 분류', value: 'all' },
      ...categories.map((value) => ({ label: value, value })),
    ],
    [categories],
  )

  const columns = useMemo<TableColumn<Product>[]>(
    () => [
      { key: 'sku', header: 'SKU', width: '120px' },
      {
        key: 'name',
        header: '품목명',
        render: (row) => <Text variant="bodyStrong">{row.name}</Text>,
      },
      { key: 'category', header: '분류', width: '100px' },
      { key: 'unit', header: '단위', width: '70px', align: 'center' },
      {
        key: 'cost',
        header: '원가',
        width: '120px',
        numeric: true,
        render: (row) => formatCurrency(row.cost),
      },
      {
        key: 'price',
        header: '판매가',
        width: '120px',
        numeric: true,
        render: (row) => formatCurrency(row.price),
      },
      {
        key: 'stock',
        header: '재고',
        width: '120px',
        numeric: true,
        render: (row) => (
          <Text
            numeric
            color={row.stock <= row.safetyStock ? 'dangerText' : 'text'}
            title={`안전재고 ${formatNumber(row.safetyStock)}`}
          >
            {formatNumber(row.stock)}
          </Text>
        ),
      },
      {
        key: 'status',
        header: '상태',
        width: '90px',
        align: 'center',
        render: (row) => (
          <Badge tone={PRODUCT_STATUS[row.status].tone} size="sm" dot>
            {PRODUCT_STATUS[row.status].label}
          </Badge>
        ),
      },
      {
        key: 'updatedAt',
        header: '최종수정',
        width: '110px',
        render: (row) => formatDate(row.updatedAt),
      },
    ],
    [],
  )

  return (
    <>
      <PageHeader
        title="품목관리"
        description="품목 기준정보와 재고 현황을 확인합니다."
        actions={
          <Button
            variant={filters.lowStock ? 'primary' : 'secondary'}
            onClick={() => setFilters({ lowStock: !filters.lowStock })}
          >
            안전재고 미달만 보기
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
              placeholder="SKU, 품목명 검색"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              aria-label="품목 검색"
            />
            <Button type="submit" variant="secondary">
              검색
            </Button>
          </form>

          <Select
            options={categoryOptions}
            value={filters.category}
            onChange={(event) => setFilters({ category: event.target.value })}
            aria-label="분류 필터"
            style={{ width: 150 }}
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

          <Checkbox
            label="안전재고 미달"
            checked={filters.lowStock}
            onChange={(event) => setFilters({ lowStock: event.target.checked })}
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
          emptyTitle="조건에 맞는 품목이 없습니다"
          emptyDescription="검색어나 필터를 변경해 보세요."
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
    </>
  )
}
