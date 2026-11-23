import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { NavCapitulos } from './NavCapitulos'
import { capitulos } from '../data/capitulos'
import { areasDoNavio } from '../data/areas'

vi.mock('../hooks/useProgressoCapitulo', () => ({ useProgressoCapitulo: () => 0.5 }))

function ancora(id: string, topo: number) {
  const el = document.createElement('section')
  el.id = id
  el.getBoundingClientRect = () => ({ top: topo, bottom: topo + 2000, left: 0, right: 0, width: 0, height: 2000, x: 0, y: topo, toJSON: () => ({}) })
  el.scrollIntoView = vi.fn()
  document.body.appendChild(el)
  return el
}

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  })
})

afterEach(() => {
  document.body.innerHTML = ''
})

function montar() {
  return render(<NavCapitulos capitulos={capitulos} areas={areasDoNavio} />)
}

it('clicar na aba rola até a âncora do capítulo', () => {
  const navio = ancora('capitulo-navio', 0)
  const buzios = ancora('capitulo-buzios', 2000)
  montar()
  fireEvent.click(screen.getByRole('button', { name: 'Búzios' }))
  expect(buzios.scrollIntoView).toHaveBeenCalled()
  expect(navio.scrollIntoView).not.toHaveBeenCalled()
})

it('marca a aba do capítulo atual com aria-current', () => {
  ancora('capitulo-navio', -2500)
  ancora('capitulo-buzios', 100)
  montar()
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
  expect(screen.getByRole('button', { name: 'Búzios' })).toHaveAttribute('aria-current', 'true')
  expect(screen.getByRole('button', { name: 'O navio' })).not.toHaveAttribute('aria-current')
})

it('o ☰ abre o índice com as 14 áreas, Esc fecha e devolve o foco', () => {
  montar()
  const botao = screen.getByRole('button', { name: 'Índice' })
  fireEvent.click(botao)
  const dialogo = document.querySelector('dialog')!
  expect(dialogo).toHaveAttribute('open')
  const links = within(dialogo).getAllByRole('link').filter((a) => areasDoNavio.some((ar) => a.getAttribute('href') === `#${ar.id}`))
  expect(links).toHaveLength(14)
  expect(within(dialogo).getByRole('link', { name: /Recepção/ })).toHaveAttribute('href', '#recepcao')
  expect(within(dialogo).getAllByText(/^Deck /).length).toBeGreaterThan(0)

  fireEvent.keyDown(dialogo, { key: 'Escape' })
  expect(dialogo).not.toHaveAttribute('open')
  expect(botao).toHaveFocus()
})

it('clicar num item do índice fecha o diálogo', () => {
  montar()
  fireEvent.click(screen.getByRole('button', { name: 'Índice' }))
  const dialogo = document.querySelector('dialog')!
  fireEvent.click(within(dialogo).getByRole('link', { name: /Recepção/ }))
  expect(dialogo).not.toHaveAttribute('open')
})
