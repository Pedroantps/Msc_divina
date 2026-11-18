import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { gsap } from '../lib/gsap'
import { Hero } from './Hero'

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

it('mostra o título e a foto com texto alternativo', () => {
  mockMatchMedia(false)
  render(<Hero imagem="/img/divina-externa.webp" alvo={{ x: 62, y: 48 }} />)
  expect(screen.getByRole('heading', { level: 1, name: 'MSC Divina' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'O navio MSC Divina visto de fora' })).toBeInTheDocument()
})

it('com movimento reduzido marca a seção como estática', () => {
  mockMatchMedia(true)
  render(<Hero imagem="/img/divina-externa.webp" alvo={{ x: 62, y: 48 }} />)
  expect(screen.getByTestId('hero')).toHaveAttribute('data-estatico', 'true')
})

it('sem movimento reduzido cria a timeline com scrollTrigger', () => {
  mockMatchMedia(false)
  const espiao = vi.spyOn(gsap, 'timeline')
  render(<Hero imagem="/img/divina-externa.webp" alvo={{ x: 62, y: 48 }} />)
  expect(espiao).toHaveBeenCalledWith(
    expect.objectContaining({
      scrollTrigger: expect.objectContaining({
        trigger: screen.getByTestId('hero'),
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        invalidateOnRefresh: true,
      }),
    }),
  )
})

it('com movimento reduzido n�o cria timeline', () => {
  mockMatchMedia(true)
  const espiao = vi.spyOn(gsap, 'timeline')
  render(<Hero imagem="/img/divina-externa.webp" alvo={{ x: 62, y: 48 }} />)
  expect(espiao).not.toHaveBeenCalled()
})
