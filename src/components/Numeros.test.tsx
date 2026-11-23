import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { gsap } from '../lib/gsap'
import { Numeros } from './Numeros'

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

const itens = [
  { valor: 14, legenda: 'áreas do navio' },
  { valor: 35, legenda: 'ambientes em 360°' },
  { valor: 18, legenda: 'é o deck mais alto' },
  { valor: 4, legenda: 'lugares em Búzios' },
]

it('expõe o valor final e a legenda de cada item para leitores de tela', () => {
  mockMatchMedia(false)
  render(<Numeros itens={itens} />)
  expect(screen.getAllByRole('listitem')).toHaveLength(4)
  expect(screen.getByText('14 áreas do navio')).toBeInTheDocument()
  expect(screen.getByText('35 ambientes em 360°')).toBeInTheDocument()
  expect(screen.getByText('18 é o deck mais alto')).toBeInTheDocument()
  expect(screen.getByText('4 lugares em Búzios')).toBeInTheDocument()
})

it('com movimento reduzido mostra o valor final direto e não anima', () => {
  mockMatchMedia(true)
  const espiao = vi.spyOn(gsap, 'to')
  const { container } = render(<Numeros itens={itens} />)
  const valores = Array.from(container.querySelectorAll('.numeros__valor')).map((e) => e.textContent)
  expect(valores).toEqual(['14', '35', '18', '4'])
  expect(espiao).not.toHaveBeenCalled()
})

it('sem movimento reduzido parte de 0 e mantém o valor final acessível', () => {
  mockMatchMedia(false)
  const { container } = render(<Numeros itens={itens} />)
  const valores = Array.from(container.querySelectorAll('.numeros__valor')).map((e) => e.textContent)
  expect(valores).toEqual(['0', '0', '0', '0'])
  expect(screen.getByText('14 áreas do navio')).toBeInTheDocument()
})
