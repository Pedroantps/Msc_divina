import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { gsap } from '../lib/gsap'
import { areasDoNavio } from '../data/areas'
import { AreasDoNavio } from './AreasDoNavio'

const original = window.matchMedia

function mockMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}

afterEach(() => {
  vi.restoreAllMocks()
  window.matchMedia = original
})

it('renderiza uma seção por área com título e deck', () => {
  mockMatchMedia(false)
  render(<AreasDoNavio areas={areasDoNavio} />)
  expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(areasDoNavio.length)
  expect(screen.getByText(`Deck ${areasDoNavio[0].deck}`)).toBeInTheDocument()
})

it('usa renderMidia quando fornecido', () => {
  mockMatchMedia(false)
  render(<AreasDoNavio areas={areasDoNavio.slice(0, 1)} renderMidia={() => <p>mídia custom</p>} />)
  expect(screen.getByText('mídia custom')).toBeInTheDocument()
})

it('com movimento reduzido todas as seções ficam visíveis e cada uma mostra sua mídia', () => {
  mockMatchMedia(true)
  const espiao = vi.spyOn(gsap, 'fromTo')
  render(<AreasDoNavio areas={areasDoNavio} />)
  const secoes = screen.getAllByRole('region')
  expect(secoes).toHaveLength(areasDoNavio.length)
  secoes.forEach((s) => expect(s).not.toHaveStyle({ opacity: '0' }))
  expect(screen.getAllByRole('img')).toHaveLength(areasDoNavio.length)
  expect(espiao).not.toHaveBeenCalled()
})

it('sem movimento reduzido cria um tween com scrollTrigger por camada após a primeira', () => {
  mockMatchMedia(false)
  const espiao = vi.spyOn(gsap, 'fromTo')
  render(<AreasDoNavio areas={areasDoNavio} />)
  expect(espiao).toHaveBeenCalledTimes(areasDoNavio.length - 1)
  expect(espiao).toHaveBeenCalledWith(
    expect.anything(),
    { autoAlpha: 0 },
    expect.objectContaining({
      autoAlpha: 1,
      scrollTrigger: expect.objectContaining({ scrub: true }),
    }),
  )
})
