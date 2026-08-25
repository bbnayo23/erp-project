import styled from 'styled-components'

export interface PaginationProps {
  /** 1-based */
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  /** 앞뒤로 보여줄 페이지 버튼 수 */
  siblingCount?: number
  className?: string
}

const Root = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
`

const Summary = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`

const Pages = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`

const PageButton = styled.button<{ $active?: boolean }>`
  min-width: 32px;
  height: 32px;
  padding-inline: ${({ theme }) => theme.spacing[2]};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: ${({ theme }) => theme.borderWidth.thin} solid
    ${({ theme, $active }) => ($active ? theme.colors.primary : 'transparent')};
  background: ${({ theme, $active }) => ($active ? theme.colors.primarySubtle : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.textMuted)};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme, $active }) =>
    $active ? theme.font.weight.semibold : theme.font.weight.regular};
  font-variant-numeric: tabular-nums;
  transition: background-color ${({ theme }) => theme.duration.fast};

  &:hover:not(:disabled) {
    background: ${({ theme, $active }) =>
      $active ? theme.colors.primarySubtle : theme.colors.surfaceHover};
    color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.text)};
  }

  &:disabled {
    color: ${({ theme }) => theme.colors.textDisabled};
    cursor: not-allowed;
  }
`

const Ellipsis = styled.span`
  min-width: 32px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textDisabled};
  font-size: ${({ theme }) => theme.font.size.sm};
`

const SizeSelect = styled.select`
  height: 32px;
  padding-inline: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.sm};
  border: ${({ theme }) => theme.borderWidth.thin} solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.font.size.sm};
`

/** 1 … 4 5 [6] 7 8 … 20 형태의 페이지 목록을 만든다 */
function buildPages(page: number, totalPages: number, siblingCount: number): (number | '…')[] {
  const totalSlots = siblingCount * 2 + 5
  if (totalPages <= totalSlots) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const left = Math.max(page - siblingCount, 1)
  const right = Math.min(page + siblingCount, totalPages)
  const showLeftEllipsis = left > 2
  const showRightEllipsis = right < totalPages - 1

  const pages: (number | '…')[] = [1]
  if (showLeftEllipsis) pages.push('…')

  for (let i = Math.max(left, 2); i <= Math.min(right, totalPages - 1); i += 1) {
    pages.push(i)
  }

  if (showRightEllipsis) pages.push('…')
  pages.push(totalPages)
  return pages
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  siblingCount = 1,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const pages = buildPages(page, totalPages, siblingCount)

  return (
    <Root className={className} aria-label="페이지 이동">
      <Summary>
        총 {total.toLocaleString('ko-KR')}건 중 {from.toLocaleString('ko-KR')}–
        {to.toLocaleString('ko-KR')}
      </Summary>

      <Pages>
        <PageButton
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="이전 페이지"
        >
          ‹
        </PageButton>

        {pages.map((item, index) =>
          item === '…' ? (
            <Ellipsis key={`ellipsis-${index}`}>…</Ellipsis>
          ) : (
            <PageButton
              key={item}
              $active={item === page}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </PageButton>
          ),
        )}

        <PageButton
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="다음 페이지"
        >
          ›
        </PageButton>
      </Pages>

      {onPageSizeChange && (
        <SizeSelect
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label="페이지당 행 수"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}개씩
            </option>
          ))}
        </SizeSelect>
      )}
    </Root>
  )
}
