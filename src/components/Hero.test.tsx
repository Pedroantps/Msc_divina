import { render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
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
