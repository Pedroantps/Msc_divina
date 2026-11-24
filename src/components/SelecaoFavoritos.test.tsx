import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { areasDoNavio } from '../data/areas'
import { lugaresBuzios } from '../data/buzios'
import { CHAVE_FAVORITOS } from '../hooks/useFavoritos'
import { gsap } from '../lib/gsap'
import { SelecaoFavoritos } from './SelecaoFavoritos'

const todas = [...areasDoNavio, ...lugaresBuzios]
// Arquivos reais de public/img/640 (só os nomes).
const variantes640 = Object.keys(import.meta.glob('../../public/img/640/*.webp')).map((c) => c.split('/').pop())

const original = window.matchMedia

function mockMatchMedia(reduzido: boolean, larga = true) {
  window.matchMedia = ((query: string) => ({
    matches: (query.includes('min-width') ? larga : true) && (query.includes('no-preference') ? !reduzido : query.includes('reduce') ? reduzido : true),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}

beforeEach(() => {
  localStorage.clear()
  mockMatchMedia(false)
})
afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  window.matchMedia = original
})

it('tem título, instrução e a seção clara com id favoritos', () => {
  const { container } = render(<SelecaoFavoritos areas={todas} />)
  expect(screen.getByRole('heading', { level: 2, name: 'Nossos favoritos' })).toBeInTheDocument()
  expect(screen.getByText('Marque o que vocês mais querem aproveitar')).toBeInTheDocument()
  const secao = container.querySelector('section')
  expect(secao).toHaveAttribute('id', 'favoritos')
  expect(secao).toHaveAttribute('data-tema', 'claro')
})

it('há um cartão (h3) e um botão de favoritar por área', () => {
  render(<SelecaoFavoritos areas={todas} />)
  expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(todas.length)
  for (const a of todas) expect(screen.getByRole('button', { name: `Favoritar ${a.nome}` })).toBeInTheDocument()
})

it('mostra Deck ou Búzios como legenda', () => {
  render(<SelecaoFavoritos areas={[areasDoNavio[0], lugaresBuzios[0]]} />)
  expect(screen.getByText(`Deck ${areasDoNavio[0].deck}`)).toBeInTheDocument()
  expect(screen.getAllByText('Búzios').some((e) => e.className.includes('favoritos__legenda'))).toBe(true)
})

it('Cabines mostra a quantidade de ambientes em 360° e nunca "undefined"', () => {
  const cabines = areasDoNavio.find((a) => a.id === 'cabines')!
  const { container } = render(<SelecaoFavoritos areas={[cabines]} />)
  expect(container.textContent).not.toContain('undefined')
  expect(screen.getByText(`${cabines.cenas!.length} ambientes em 360°`)).toBeInTheDocument()
})

it('favoritar mantém o rótulo fixo e só alterna aria-pressed e persiste', async () => {
  render(<SelecaoFavoritos areas={todas} />)
  const nome = areasDoNavio[0].nome
  const b = screen.getByRole('button', { name: `Favoritar ${nome}` })
  expect(b).toHaveAttribute('aria-pressed', 'false')
  await userEvent.click(b)
  const marcado = screen.getByRole('button', { name: `Favoritar ${nome}` })
  expect(marcado).toHaveAttribute('aria-pressed', 'true')
  expect(JSON.parse(localStorage.getItem(CHAVE_FAVORITOS) ?? '[]')).toEqual([areasDoNavio[0].id])
  await userEvent.click(marcado)
  expect(screen.getByRole('button', { name: `Favoritar ${nome}` })).toHaveAttribute('aria-pressed', 'false')
})

it('lê os favoritos salvos', () => {
  localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify([lugaresBuzios[0].id]))
  render(<SelecaoFavoritos areas={todas} />)
  expect(screen.getByRole('button', { name: `Favoritar ${lugaresBuzios[0].nome}` })).toHaveAttribute('aria-pressed', 'true')
})

it('a barra de resumo fica oculta sem seleção e visível com seleção', async () => {
  const { container } = render(<SelecaoFavoritos areas={todas} />)
  const resumo = container.querySelector('.favoritos__resumo')!
  expect(resumo).toHaveClass('favoritos__resumo--vazio')
  await userEvent.click(screen.getByRole('button', { name: `Favoritar ${areasDoNavio[0].nome}` }))
  expect(resumo).not.toHaveClass('favoritos__resumo--vazio')
})

it('todo cartão tem srcSet com a variante de 640px que existe em disco', () => {
  const { container } = render(<SelecaoFavoritos areas={todas} />)
  const imgs = Array.from(container.querySelectorAll('.favoritos__foto img'))
  expect(imgs).toHaveLength(todas.length)
  for (const img of imgs) {
    const mini = /(\/img\/640\/[^\s]+)\s+640w/.exec(img.getAttribute('srcset') ?? '')?.[1]
    expect(mini).toBeTruthy()
    expect(variantes640).toContain(mini!.split('/').pop())
    expect(img).toHaveAttribute('sizes')
  }
})

it('o foco por teclado dentro das colunas leva o elemento ao centro da tela', async () => {
  const rolar = vi.fn()
  Element.prototype.scrollIntoView = rolar
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => setTimeout(() => cb(0), 0) as unknown as number)
  render(<SelecaoFavoritos areas={todas} />)
  await userEvent.tab()
  await waitFor(() => expect(rolar).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' }))
})

it('com movimento reduzido o foco rola com behavior auto', async () => {
  const rolar = vi.fn()
  Element.prototype.scrollIntoView = rolar
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => setTimeout(() => cb(0), 0) as unknown as number)
  mockMatchMedia(true)
  render(<SelecaoFavoritos areas={todas} />)
  await userEvent.tab()
  await waitFor(() => expect(rolar).toHaveBeenCalledWith({ block: 'center', behavior: 'auto' }))
})

it('o resumo aria-live atualiza e limpar desmarca tudo', async () => {
  render(<SelecaoFavoritos areas={todas} />)
  const resumo = screen.getByText('Nenhum lugar escolhido')
  expect(resumo).toHaveAttribute('aria-live', 'polite')
  await userEvent.click(screen.getByRole('button', { name: `Favoritar ${areasDoNavio[0].nome}` }))
  expect(screen.getByText('1 lugar escolhido')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: `Favoritar ${lugaresBuzios[0].nome}` }))
  expect(screen.getByText('2 lugares escolhidos')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Limpar seleção' }))
  expect(screen.getByText('Nenhum lugar escolhido')).toBeInTheDocument()
})

it('a palavra-marca e a rota são decorativas', () => {
  const { container } = render(<SelecaoFavoritos areas={todas} />)
  const marca = container.querySelector('.favoritos__marca')
  expect(marca).toHaveAttribute('aria-hidden', 'true')
  expect(marca).toHaveClass('exibicao')
  expect(container.querySelector('.rota')).toHaveAttribute('aria-hidden', 'true')
})

it('em tela larga sem movimento reduzido cria parallax por scrub', () => {
  const espiao = vi.spyOn(gsap, 'fromTo')
  render(<SelecaoFavoritos areas={todas} />)
  expect(espiao).toHaveBeenCalledWith(
    '.favoritos__coluna--b',
    expect.anything(),
    expect.objectContaining({ scrollTrigger: expect.objectContaining({ scrub: true }) }),
  )
})

it('no celular ou com movimento reduzido não cria parallax', () => {
  const espiao = vi.spyOn(gsap, 'fromTo')
  mockMatchMedia(false, false)
  render(<SelecaoFavoritos areas={todas} />)
  mockMatchMedia(true, true)
  render(<SelecaoFavoritos areas={todas} />)
  const colunas = espiao.mock.calls.filter(([alvo]) => typeof alvo === 'string' && alvo.startsWith('.favoritos__'))
  expect(colunas).toHaveLength(0)
})
