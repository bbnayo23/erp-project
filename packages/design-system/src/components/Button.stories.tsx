import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, IconButton } from './Button'
import { HStack, VStack } from './Stack'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: '저장',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    fullWidth: false,
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger', 'link'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    onClick: { action: 'clicked' },
  },
}
export default meta

type Story = StoryObj<typeof Button>

export const Playground: Story = {}

export const Variants: Story = {
  render: (args) => (
    <HStack gap={2} align="center" wrap>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="danger">
        Danger
      </Button>
      <Button {...args} variant="link">
        Link
      </Button>
    </HStack>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <HStack gap={2} align="center">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </HStack>
  ),
}

export const States: Story = {
  render: (args) => (
    <VStack gap={3}>
      <HStack gap={2}>
        <Button {...args}>기본</Button>
        <Button {...args} loading>
          로딩
        </Button>
        <Button {...args} disabled>
          비활성
        </Button>
      </HStack>
      <HStack gap={2}>
        <Button {...args} variant="secondary">
          기본
        </Button>
        <Button {...args} variant="secondary" loading>
          로딩
        </Button>
        <Button {...args} variant="secondary" disabled>
          비활성
        </Button>
      </HStack>
    </VStack>
  ),
}

const PlusIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

export const WithIcon: Story = {
  render: (args) => (
    <HStack gap={2} align="center">
      <Button {...args} leftIcon={<PlusIcon />}>
        신규 등록
      </Button>
      <IconButton aria-label="추가" variant="secondary" size="md">
        <PlusIcon />
      </IconButton>
      <IconButton aria-label="추가" variant="primary" size="sm">
        <PlusIcon />
      </IconButton>
    </HStack>
  ),
}
