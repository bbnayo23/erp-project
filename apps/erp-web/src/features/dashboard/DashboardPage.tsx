import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  LoadingBlock,
  Table,
  Text,
  type TableColumn,
} from '@erp/design-system'
import { apiClient, toErrorMessage } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/api/types'
import { ORDER_STATUS } from '@/shared/lib/constants'
import {
  formatCompactWon,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from '@/shared/lib/format'
import { ErrorBanner, PageHeader } from '@/shared/ui/PageHeader'
import type { DashboardSummary } from '@/types/domain'

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`

const StatValue = styled.p`
  margin-top: ${({ theme }) => theme.spacing[1]};
  font-size: ${({ theme }) => theme.font.size['3xl']};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text};
  font-variant-numeric: tabular-nums;
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
`

const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: ${({ theme }) => theme.spacing[4]};
  align-items: start;

  ${({ theme }) => theme.media.maxLg} {
    grid-template-columns: 1fr;
  }
`

const Chart = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing[4]};
  height: 220px;
  padding-top: ${({ theme }) => theme.spacing[4]};
`

const ChartColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  height: 100%;
  justify-content: flex-end;
`

const Bar = styled.div<{ $ratio: number }>`
  width: 100%;
  max-width: 56px;
  height: ${({ $ratio }) => Math.max($ratio * 100, 2)}%;
  border-radius: ${({ theme }) => theme.radius.sm} ${({ theme }) => theme.radius.sm} 0 0;
  background: linear-gradient(
    180deg,
    ${({ theme }) => theme.colors.primary},
    ${({ theme }) => theme.colors.primaryHover}
  );
  transition: height ${({ theme }) => theme.duration.slow} ${({ theme }) => theme.easing.standard};
`

type RecentOrder = DashboardSummary['recentOrders'][number]

const recentOrderColumns: TableColumn<RecentOrder>[] = [
  { key: 'orderNo', header: '주문번호', width: '140px' },
  { key: 'customer', header: '거래처' },
  {
    key: 'status',
    header: '상태',
    width: '90px',
    render: (row) => (
      <Badge tone={ORDER_STATUS[row.status].tone} size="sm" dot>
        {ORDER_STATUS[row.status].label}
      </Badge>
    ),
  },
  {
    key: 'totalAmount',
    header: '금액',
    numeric: true,
    render: (row) => formatCurrency(row.totalAmount),
  },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    apiClient
      .get<ApiResponse<DashboardSummary>>('/dashboard/summary')
      .then((response) => {
        if (alive) setSummary(response.data)
      })
      .catch((cause: unknown) => {
        if (alive) setError(toErrorMessage(cause))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  if (loading) return <LoadingBlock label="대시보드를 불러오는 중…" />

  if (error || !summary) {
    return (
      <Card padding="none">
        <ErrorBanner>{error ?? '데이터를 불러오지 못했습니다.'}</ErrorBanner>
      </Card>
    )
  }

  const maxRevenue = Math.max(...summary.monthlyRevenue.map((item) => item.amount), 1)

  return (
    <>
      <PageHeader
        title="대시보드"
        description="이번 달 실적과 처리해야 할 항목을 한눈에 확인합니다."
        actions={
          <Button variant="secondary" size="sm" onClick={() => void navigate('/orders')}>
            수주 현황 보기
          </Button>
        }
      />

      <StatGrid>
        <Card>
          <Text variant="caption" color="textMuted">
            이번 달 매출
          </Text>
          <StatValue>{formatCompactWon(summary.revenueThisMonth)}</StatValue>
          <Badge
            tone={summary.revenueGrowthRate >= 0 ? 'success' : 'danger'}
            size="sm"
            style={{ marginTop: 8 }}
          >
            전월 대비 {formatPercent(summary.revenueGrowthRate)}
          </Badge>
        </Card>

        <Card>
          <Text variant="caption" color="textMuted">
            진행 중 수주
          </Text>
          <StatValue>{formatNumber(summary.openOrders)}건</StatValue>
          <Text variant="caption" color="textSubtle" style={{ display: 'block', marginTop: 8 }}>
            확정 · 출고 상태 합계
          </Text>
        </Card>

        <Card>
          <Text variant="caption" color="textMuted">
            안전재고 미달 품목
          </Text>
          <StatValue>{formatNumber(summary.lowStockCount)}건</StatValue>
          <Badge tone="warning" size="sm" style={{ marginTop: 8 }}>
            발주 검토 필요
          </Badge>
        </Card>

        <Card>
          <Text variant="caption" color="textMuted">
            재직 사원
          </Text>
          <StatValue>{formatNumber(summary.activeEmployees)}명</StatValue>
          <Text variant="caption" color="textSubtle" style={{ display: 'block', marginTop: 8 }}>
            휴직 · 퇴사 제외
          </Text>
        </Card>
      </StatGrid>

      <Columns>
        <Card padding="none">
          <CardHeader title="월별 매출 추이" description="최근 6개월, 취소 건 제외" />
          <CardBody>
            <Chart>
              {summary.monthlyRevenue.map((item) => (
                <ChartColumn key={item.month}>
                  <Text variant="caption" color="textMuted" numeric>
                    {formatCompactWon(item.amount)}
                  </Text>
                  <Bar $ratio={item.amount / maxRevenue} title={formatCurrency(item.amount)} />
                  <Text variant="caption" color="textSubtle">
                    {item.month}
                  </Text>
                </ChartColumn>
              ))}
            </Chart>
          </CardBody>
        </Card>

        <Card padding="none">
          <CardHeader
            title="최근 수주"
            description={`최근 등록순 ${summary.recentOrders.length}건`}
          />
          <Table
            columns={recentOrderColumns}
            data={summary.recentOrders}
            rowKey={(row) => row.id}
            emptyTitle="최근 수주가 없습니다"
          />
          <CardBody padding="sm">
            <Text variant="caption" color="textSubtle">
              최종 갱신 {formatDate(summary.recentOrders[0]?.orderedAt ?? '')}
            </Text>
          </CardBody>
        </Card>
      </Columns>
    </>
  )
}
