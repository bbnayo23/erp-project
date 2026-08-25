import type { Meta, StoryObj } from '@storybook/react-vite'
import styled, { useTheme } from 'styled-components'
import { palette, spacing, radius, textStyle, type TextStyleName } from '../tokens'
import { Text } from '../components/Text'

const meta: Meta = {
  title: 'Foundations/Tokens',
  parameters: { layout: 'fullscreen' },
}
export default meta

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[10]};
`

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.size['2xl']};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.spacing[3]};
`

const Swatch = styled.div<{ $color: string }>`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;

  > div:first-child {
    height: 56px;
    background: ${({ $color }) => $color};
  }

  > div:last-child {
    padding: ${({ theme }) => theme.spacing[2]};
    font-size: ${({ theme }) => theme.font.size.xs};
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.textMuted};
    font-family: ${({ theme }) => theme.font.family.mono};
  }
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`

const Bar = styled.div<{ $width: string }>`
  height: 16px;
  width: ${({ $width }) => $width};
  background: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.xs};
`

const Label = styled.code`
  font-family: ${({ theme }) => theme.font.family.mono};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  min-width: 120px;
`

export const Colors: StoryObj = {
  render: () => {
    const theme = useTheme()
    return (
      <div>
        <Section>
          <SectionTitle>Semantic ({theme.mode})</SectionTitle>
          <Grid>
            {Object.entries(theme.colors).map(([name, value]) => (
              <Swatch key={name} $color={value}>
                <div />
                <div>
                  {name}
                  <br />
                  {value}
                </div>
              </Swatch>
            ))}
          </Grid>
        </Section>

        {Object.entries(palette)
          .filter(([, value]) => typeof value === 'object')
          .map(([group, scale]) => (
            <Section key={group}>
              <SectionTitle>palette.{group}</SectionTitle>
              <Grid>
                {Object.entries(scale as Record<string, string>).map(([step, value]) => (
                  <Swatch key={step} $color={value}>
                    <div />
                    <div>
                      {group}.{step}
                      <br />
                      {value}
                    </div>
                  </Swatch>
                ))}
              </Grid>
            </Section>
          ))}
      </div>
    )
  },
}

export const Typography: StoryObj = {
  render: () => (
    <Section>
      <SectionTitle>Text styles</SectionTitle>
      {(Object.keys(textStyle) as TextStyleName[]).map((name) => (
        <Row key={name}>
          <Label>{name}</Label>
          <Text variant={name}>다람쥐 헌 쳇바퀴에 타고파 — The quick brown fox 0123456789</Text>
        </Row>
      ))}
    </Section>
  ),
}

export const Spacing: StoryObj = {
  render: () => (
    <Section>
      <SectionTitle>Spacing scale</SectionTitle>
      {Object.entries(spacing).map(([key, value]) => (
        <Row key={key}>
          <Label>
            spacing[{key}] · {value}
          </Label>
          <Bar $width={value} />
        </Row>
      ))}
    </Section>
  ),
}

export const Radius: StoryObj = {
  render: () => (
    <Section>
      <SectionTitle>Radius scale</SectionTitle>
      <Grid>
        {Object.entries(radius).map(([key, value]) => (
          <div key={key} style={{ textAlign: 'center' }}>
            <div
              style={{
                height: 72,
                borderRadius: value,
                background: 'currentColor',
                opacity: 0.15,
                marginBottom: 8,
              }}
            />
            <Label>
              {key} · {value}
            </Label>
          </div>
        ))}
      </Grid>
    </Section>
  ),
}
