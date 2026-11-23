import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { capas } from '../data/capas'
import { lugaresBuzios } from '../data/buzios'
import { gsap } from '../lib/gsap'
import { Buzios } from './Buzios'

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

function montar() {
  return render(<Buzios lugares={lugaresBuzios} capa={capas.buzios} />)
}

it('abre com o h2 "Búzios" e a capa com texto alternativo', () => {
  mockMatchMedia(false)
  montar()
  expect(screen.getByRole('heading', { level: 2, name: 'Búzios' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: capas.buzios.alt })).toBeInTheDocument()
})

it('é uma região clara com id padrão e nomeada pelo título', () => {
  mockMatchMedia(false)
  montar()
  const regiao = screen.getByRole('region', { name: 'Búzios' })
  expect(regiao).toHaveAttribute('id', 'capitulo-buzios')
  expect(regiao).toHaveAttribute('data-tema', 'claro')
})

it('aceita um id próprio', () => {
  mockMatchMedia(false)
  render(<Buzios lugares={lugaresBuzios} capa={capas.buzios} id="outro" />)
  expect(document.getElementById('outro')).toBeInTheDocument()
})

it('mostra um bloco por lugar, com id, frase, nome, descrição e foto', () => {
  mockMatchMedia(false)
  montar()
  lugaresBuzios.forEach((l) => {
    const bloco = document.getElementById(l.id)!
    expect(bloco).toBeInTheDocument()
    expect(bloco).toHaveTextContent(l.frase)
    expect(bloco).toHaveTextContent(l.descricao)
    expect(screen.getByRole('heading', { level: 3, name: l.nome })).toBeInTheDocument()
    expect(bloco.querySelector('img')).toHaveAttribute('src', l.imagem)
  })
})

it('mostra a fileira de números do capítulo', () => {
  mockMatchMedia(false)
  montar()
  expect(screen.getByText('14 áreas do navio')).toBeInTheDocument()
  expect(screen.getByText('4 lugares em Búzios')).toBeInTheDocument()
})

it('sem movimento reduzido cria o parallax com scrub', () => {
  mockMatchMedia(false)
  const espiao = vi.spyOn(gsap, 'fromTo')
  montar()
  expect(espiao).toHaveBeenCalledWith(
    '.buzios__midia',
    expect.anything(),
    expect.objectContaining({ scrollTrigger: expect.objectContaining({ scrub: true }) }),
  )
})

it('com movimento reduzido não cria animação e tudo fica visível', () => {
  mockMatchMedia(true)
  const fromTo = vi.spyOn(gsap, 'fromTo')
  const to = vi.spyOn(gsap, 'to')
  montar()
  expect(fromTo).not.toHaveBeenCalled()
  expect(to).not.toHaveBeenCalled()
  lugaresBuzios.forEach((l) => expect(document.getElementById(l.id)).toBeInTheDocument())
})
