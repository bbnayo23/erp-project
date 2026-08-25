import { Button, Card, CardBody, CardHeader, Field, Radio, Text } from '@erp/design-system'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { PageHeader } from '@/shared/ui/PageHeader'

export function SettingsPage() {
  const user = useAuthStore((state) => state.user)
  const themeMode = useUiStore((state) => state.themeMode)
  const setThemeMode = useUiStore((state) => state.setThemeMode)

  return (
    <>
      <PageHeader title="환경설정" description="화면 표시 방식과 계정 정보를 확인합니다." />

      <div style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
        <Card padding="none">
          <CardHeader title="테마" description="선택한 값은 브라우저에 저장됩니다." />
          <CardBody>
            <div style={{ display: 'flex', gap: 24 }}>
              <Radio
                name="theme"
                label="라이트"
                value="light"
                checked={themeMode === 'light'}
                onChange={() => setThemeMode('light')}
              />
              <Radio
                name="theme"
                label="다크"
                value="dark"
                checked={themeMode === 'dark'}
                onChange={() => setThemeMode('dark')}
              />
            </div>
          </CardBody>
        </Card>

        <Card padding="none">
          <CardHeader title="계정" description="목업 API 가 반환하는 현재 사용자" />
          <CardBody>
            <div style={{ display: 'grid', gap: 12 }}>
              <Field label="이름">{() => <Text>{user?.name ?? '-'}</Text>}</Field>
              <Field label="이메일">{() => <Text>{user?.email ?? '-'}</Text>}</Field>
              <Field label="부서">{() => <Text>{user?.department ?? '-'}</Text>}</Field>
              <Field label="권한">{() => <Text>{user?.role ?? '-'}</Text>}</Field>
            </div>
          </CardBody>
        </Card>

        <Card padding="none">
          <CardHeader title="목업 데이터" description="새로고침하면 시드 상태로 되돌아갑니다." />
          <CardBody>
            <Text color="textMuted" style={{ display: 'block', marginBottom: 12 }}>
              MSW 가 <code>/api/*</code> 요청을 가로채 브라우저 메모리 DB로 응답합니다. 실제
              백엔드에 붙일 때는 <code>.env</code> 의 <code>VITE_ENABLE_MSW</code> 를{' '}
              <code>false</code> 로 바꾸세요.
            </Text>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              목업 데이터 초기화
            </Button>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
