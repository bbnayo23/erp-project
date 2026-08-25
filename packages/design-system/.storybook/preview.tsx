import type { Decorator, Preview } from '@storybook/react-vite'
import { ThemeProvider } from '../src/theme'
import { ToastProvider } from '../src/components/Toast'

const withTheme: Decorator = (Story, context) => {
  const mode = (context.globals.theme as 'light' | 'dark') ?? 'light'
  return (
    <ThemeProvider mode={mode} withGlobalStyle>
      <ToastProvider>
        <div style={{ padding: 24, minHeight: '100vh' }}>
          <Story />
        </div>
      </ToastProvider>
    </ThemeProvider>
  )
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    options: {
      storySort: {
        order: ['Foundations', 'Components'],
      },
    },
  },
  globalTypes: {
    theme: {
      description: '테마 모드',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
}

export default preview
