import { act, fireEvent, render, screen } from '@testing-library/react'
import { Cromo } from './Cromo'

function secao(id: string, tema: 'claro' | 'escuro', topo: number, base: number) {
  const el = document.createElement('section')
  el.id = id
  el.dataset.tema = tema
  el.getBoundingClientRect = () => ({ top: topo, bottom: base, left: 0, right: 0, width: 0, height: base - topo, x: 0, y: topo, toJSON: () => ({}) })
  document.body.appendChild(el)
  return el
}

// A rolagem é agrupada por quadro: nos testes o quadro roda na hora.
beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0)
    return 0
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
})

it('mostra o logo em texto, claro por padrão', () => {
  render(<Cromo />)
  const logo = screen.getByText('MSC Divina')
  expect(logo.closest('.cromo__logo')).toHaveAttribute('data-tema-logo', 'claro')
})

it('o logo escurece quando a seção sob ele é clara', () => {
  secao('capitulo-navio', 'escuro', -500, 10)
  secao('capitulo-buzios', 'claro', 10, 1500)
  render(<Cromo />)
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
  expect(screen.getByText('MSC Divina').closest('.cromo__logo')).toHaveAttribute('data-tema-logo', 'escuro')
})

it('o indicador rola até a âncora do primeiro capítulo', () => {
  const alvo = secao('capitulo-navio', 'escuro', 800, 2000)
  alvo.scrollIntoView = vi.fn()
  render(<Cromo />)
  fireEvent.click(screen.getByRole('button', { name: 'Role para embarcar' }))
  expect(alvo.scrollIntoView).toHaveBeenCalled()
})

it('o indicador some depois de 10% da janela e volta ao topo', () => {
  render(<Cromo />)
  const indicador = screen.getByRole('button', { name: 'Role para embarcar' }).closest('.cromo__rolar')!
  expect(indicador).not.toHaveClass('cromo__rolar--oculto')
  Object.defineProperty(window, 'scrollY', { value: window.innerHeight * 0.2, configurable: true })
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
  expect(indicador).toHaveClass('cromo__rolar--oculto')
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
  expect(indicador).not.toHaveClass('cromo__rolar--oculto')
})

it('agrupa vários eventos de rolagem em um único quadro', () => {
  const fila: FrameRequestCallback[] = []
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    fila.push(cb)
    return fila.length
  })
  render(<Cromo />)
  act(() => {
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
  })
  expect(fila).toHaveLength(1)
})
