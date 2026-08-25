import { useNavigate } from 'react-router-dom'
import { Button, Card, EmptyState } from '@erp/design-system'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <Card padding="none">
      <EmptyState
        title="페이지를 찾을 수 없습니다"
        description="주소가 변경되었거나 삭제된 화면입니다."
        action={<Button onClick={() => void navigate('/')}>대시보드로 이동</Button>}
      />
    </Card>
  )
}
