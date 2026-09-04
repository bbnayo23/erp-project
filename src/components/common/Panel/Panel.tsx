import { Actions, Body, Description, FilterBar, Head, HeadText, Root, Title } from './styled'
import type { PanelProps } from './types'

/**
 * 화면의 한 구획. 머리말 · 필터 줄 · 내용을 묶는다.
 *
 * 페이지 바로 아래에 놓이면 카드(`card`), 이미 카드 안이면 선(`plain`)으로 나눈다.
 * 카드 속의 카드는 어느 면이 위인지 판단을 요구하고 모서리마다 여백을 만든다.
 *
 * 머리말과 필터를 슬롯으로 받는 이유는 같다 — 화면마다 따로 조립하면 여백이 갈린다.
 * 제목을 페이지별 `SectionTitle` 로 두었더니 한쪽은 좌우 여백이 있고 다른 쪽은 없어,
 * 같은 구획인데 글자가 삐뚤어진 화면이 생겼다.
 *
 * 표는 `padded` 없이 그대로 넣는다. 표는 자기 셀에 여백이 있어 구획 여백을 또 주면
 * 첫 글자가 제목보다 안쪽으로 밀린다.
 */
export const Panel = ({
  tone = 'card',
  divided = true,
  title,
  description,
  actions,
  filter,
  padded = false,
  children,
  className,
}: PanelProps) => {
  const hasHead = Boolean(title || description || actions)

  return (
    <Root className={className} $tone={tone} $divided={divided}>
      {hasHead && (
        <Head $tone={tone}>
          <HeadText>
            {title && <Title>{title}</Title>}
            {description && <Description>{description}</Description>}
          </HeadText>
          {actions && <Actions>{actions}</Actions>}
        </Head>
      )}

      {filter && <FilterBar>{filter}</FilterBar>}

      {padded ? (
        <Body $hasHead={hasHead} $tone={tone}>
          {children}
        </Body>
      ) : (
        children
      )}
    </Root>
  )
}
