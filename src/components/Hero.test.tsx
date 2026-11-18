import { fireEvent, render, screen } from '@testing-library/react'
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

it('mostra o tÃ­tulo e a foto com texto alternativo', () => {
  mockMatchMedia(false)
  render(<Hero imagem="/img/divina-externa.webp" alvo={{ x: 62, y: 48 }} />)
  expect(screen.getByRole('heading', { level: 1, name: 'MSC Divina' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'O navio MSC Divina visto de fora' })).toBeInTheDocument()
})

it('com movimento reduzido marca a seÃ§Ã£o como estÃ¡tica', () => {
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

it('com movimento reduzido não cria timeline', () => {
  mockMatchMedia(true)
  const espiao = vi.spyOn(gsap, 'timeline')
  render(<Hero imagem="/img/divina-externa.webp" alvo={{ x: 62, y: 48 }} />)
  expect(espiao).not.toHaveBeenCalled()
})

it('o zoom anima um wrapper estável que continua no documento quando a foto falha', () => {
  mockMatchMedia(false)
  render(<Hero imagem="/img/nao-existe.webp" alvo={{ x: 62, y: 48 }} />)
  const alvoZoom = document.querySelector<HTMLElement>('.hero__midia')!
  expect(gsap.getTweensOf(alvoZoom).length).toBeGreaterThan(0)
  fireEvent.error(screen.getByRole('img', { name: 'O navio MSC Divina visto de fora' }))
  expect(screen.getByRole('img', { name: 'O navio MSC Divina visto de fora' })).toHaveAttribute('data-fallback', 'true')
  expect(alvoZoom.isConnected).toBe(true)
  expect(alvoZoom.contains(screen.getByRole('img'))).toBe(true)
})

it('carrega a imagem do hero com prioridade alta, sem aviso do React', () => {
  mockMatchMedia(false)
  const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
  render(<Hero imagem="/img/divina-externa.webp" alvo={{ x: 62, y: 48 }} />)
  const img = screen.getByRole('img', { name: 'O navio MSC Divina visto de fora' })
  expect(img).toHaveAttribute('loading', 'eager')
  expect(img).toHaveAttribute('fetchpriority', 'high')
  expect(erro).not.toHaveBeenCalled()
})
