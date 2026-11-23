import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Viewer } from '@photo-sphere-viewer/core'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { suportaWebGL } from '../lib/suportaWebGL'
import { areasDoNavio } from '../data/areas'
import { Percurso } from './Percurso'

vi.mock('../lib/suportaWebGL', () => ({ suportaWebGL: vi.fn(() => true) }))
vi.mock('@photo-sphere-viewer/core', () => ({ Viewer: vi.fn() }))
vi.mock('@photo-sphere-viewer/core/index.css', () => ({}))
vi.mock('@photo-sphere-viewer/gyroscope-plugin', () => ({ GyroscopePlugin: class GyroscopePlugin {} }))

const ViewerMock = vi.mocked(Viewer) as unknown as ReturnType<typeof vi.fn>
const destroy = vi.fn()
const originalMatchMedia = window.matchMedia
const originalIO = window.IntersectionObserver

function mockMatchMedia(reduzido: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduzido && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}

interface Obs {
  cb: IntersectionObserverCallback
  observados: Element[]
}
let observers: Obs[] = []

beforeEach(() => {
  mockMatchMedia(false)
  observers = []
  window.IntersectionObserver = vi.fn(function (cb: IntersectionObserverCallback) {
    const obs: Obs = { cb, observados: [] }
    observers.push(obs)
    return {
      observe: (el: Element) => obs.observados.push(el),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: () => [],
    }
  }) as unknown as typeof IntersectionObserver
  destroy.mockClear()
  ViewerMock.mockReset()
  ViewerMock.mockImplementation(function (config: { container: HTMLElement }) {
    config.container.appendChild(document.createElement('canvas'))
    return { destroy, setPanorama: vi.fn(() => Promise.resolve(true)), addEventListener: () => {} }
  })
  vi.mocked(suportaWebGL).mockReturnValue(true)
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  window.matchMedia = originalMatchMedia
  window.IntersectionObserver = originalIO
  document.body.removeAttribute('style')
})

const spa = areasDoNavio.find((a) => a.id === 'aurea-spa')!
const cabines = areasDoNavio.find((a) => a.id === 'cabines')!
const imagens = () => Array.from(document.querySelectorAll('img'))
const paradas = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>('section.parada'))

describe('estrutura', () => {
  it('uma parada por área, na ordem, com id = id da área', () => {
    const { container } = render(<Percurso areas={areasDoNavio} />)
    expect(paradas(container).map((s) => s.id)).toEqual(areasDoNavio.map((a) => a.id))
  })

  it('o capítulo tem a âncora padrão, o tema escuro e aceita outro id', () => {
    const { container, rerender } = render(<Percurso areas={areasDoNavio} />)
    const capitulo = container.querySelector('.percurso')!
    expect(capitulo).toHaveAttribute('id', 'capitulo-navio')
    expect(capitulo).toHaveAttribute('data-tema', 'escuro')
    rerender(<Percurso areas={areasDoNavio} id="outro" />)
    expect(container.querySelector('.percurso')).toHaveAttribute('id', 'outro')
  })

  it('cada parada mostra título, nome e deck, e a contagem de ambientes quando há vários', () => {
    const { container } = render(<Percurso areas={areasDoNavio} />)
    const secao = paradas(container).find((s) => s.id === 'aurea-spa')!
    expect(within(secao).getByRole('heading', { level: 2, name: spa.titulo })).toBeInTheDocument()
    expect(within(secao).getByText(`Aurea Spa · Deck ${spa.deck}`)).toBeInTheDocument()
    expect(within(secao).getByText(`${spa.cenas!.length} ambientes em 360°`)).toBeInTheDocument()
    expect(within(secao).getByRole('button', { name: 'Ver em 360°' })).toBeInTheDocument()
    const unica = paradas(container).find((s) => s.id === 'recepcao')!
    expect(within(unica).queryByText(/ambientes em 360°/)).not.toBeInTheDocument()
  })

  it('sem deck, a linha de metadados traz só o nome', () => {
    const { container } = render(<Percurso areas={[{ ...cabines, deck: undefined }]} />)
    expect(within(paradas(container)[0]).getByText('Cabines')).toBeInTheDocument()
  })

  it('a posição do texto alterna: esquerda, centro, direita', () => {
    const { container } = render(<Percurso areas={areasDoNavio} />)
    const posicoes = Array.from(container.querySelectorAll('.parada__texto')).map((t) => t.getAttribute('data-posicao'))
    expect(posicoes.slice(0, 4)).toEqual(['esquerda', 'centro', 'direita', 'esquerda'])
  })
})

describe('carga preguiçosa das faixas', () => {
  it('não monta nenhuma imagem antes de o capítulo chegar perto da tela', () => {
    render(<Percurso areas={areasDoNavio} />)
    expect(imagens()).toHaveLength(0)
  })

  it('monta só a faixa das paradas que entram na folga', () => {
    const { container } = render(<Percurso areas={areasDoNavio} />)
    const secoes = paradas(container)
    act(() => {
      observers[0].cb(
        [0, 1].map((i) => ({ isIntersecting: true, target: secoes[i] }) as unknown as IntersectionObserverEntry),
        {} as IntersectionObserver,
      )
    })
    expect(imagens().map((i) => i.getAttribute('src'))).toEqual([areasDoNavio[0].faixa, areasDoNavio[1].faixa])
  })

  it('a primeira faixa tem prioridade alta', () => {
    const { container } = render(<Percurso areas={areasDoNavio} />)
    act(() => {
      observers[0].cb(
        [{ isIntersecting: true, target: paradas(container)[0] } as unknown as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    })
    expect(imagens()[0]).toHaveAttribute('fetchpriority', 'high')
  })

  it('sem IntersectionObserver monta todas as faixas', () => {
    // @ts-expect-error simulando um navegador antigo
    delete window.IntersectionObserver
    render(<Percurso areas={areasDoNavio} />)
    expect(imagens()).toHaveLength(areasDoNavio.length)
  })
})

describe('rolagem', () => {
  it('cria o giro (scrub) e o fade da camada com ScrollTrigger e limpa ao desmontar', () => {
    const espiao = vi.spyOn(gsap, 'fromTo')
    const { unmount } = render(<Percurso areas={areasDoNavio} />)
    // giro em todas as paradas + fade em todas menos a primeira
    expect(espiao).toHaveBeenCalledTimes(areasDoNavio.length * 2 - 1)
    expect(espiao).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ x: 0, scale: 1 }),
      expect.objectContaining({ scale: 1.08, scrollTrigger: expect.objectContaining({ scrub: true }) }),
    )
    expect(espiao).toHaveBeenCalledWith(
      expect.anything(),
      { autoAlpha: 0 },
      expect.objectContaining({ autoAlpha: 1, scrollTrigger: expect.objectContaining({ scrub: true }) }),
    )
    expect(ScrollTrigger.getAll().length).toBeGreaterThan(0)
    unmount()
    expect(ScrollTrigger.getAll()).toHaveLength(0)
  })

  it('o texto só fica ativo na parada que o ScrollTrigger marca', () => {
    const criar = vi.spyOn(ScrollTrigger, 'create')
    const { container } = render(<Percurso areas={areasDoNavio} />)
    const gatilhos = criar.mock.calls.map(([c]) => c).filter((c) => c.start === 'top 10%')
    expect(gatilhos).toHaveLength(areasDoNavio.length)
    const textos = () => Array.from(container.querySelectorAll('.parada__texto'))
    expect(textos().every((t) => !t.hasAttribute('data-ativa'))).toBe(true)

    act(() => gatilhos[2].onToggle!({ isActive: true } as ScrollTrigger))
    expect(textos().map((t) => t.hasAttribute('data-ativa'))).toEqual(textos().map((_, i) => i === 2))

    act(() => gatilhos[2].onToggle!({ isActive: false } as ScrollTrigger))
    expect(textos().some((t) => t.hasAttribute('data-ativa'))).toBe(false)
  })

  it('foco por teclado numa parada fora da tela leva a rolagem até ela', async () => {
    const rolar = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = rolar
    const { container } = render(<Percurso areas={areasDoNavio} />)
    const botao = within(paradas(container)[3]).getByRole('button', { name: 'Ver em 360°' })
    act(() => botao.focus())
    expect(rolar).toHaveBeenCalledTimes(1)
    expect(rolar.mock.contexts[0]).toBe(paradas(container)[3])
  })
})

describe('tour 360° da área', () => {
  it('o 360 não monta antes de abrir', () => {
    render(<Percurso areas={areasDoNavio} />)
    expect(ViewerMock).not.toHaveBeenCalled()
    expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled()
  })

  it('o CTA abre o tour da área certa', async () => {
    const usuario = userEvent.setup()
    const { container } = render(<Percurso areas={areasDoNavio} />)
    const secao = paradas(container).find((s) => s.id === 'aurea-spa')!
    await usuario.click(within(secao).getByRole('button', { name: 'Ver em 360°' }))
    await waitFor(() => expect(ViewerMock).toHaveBeenCalledTimes(1))
    expect(ViewerMock).toHaveBeenCalledWith(expect.objectContaining({ panorama: spa.cenas![0].panorama }))
    expect(screen.getByRole('dialog', { name: /Aurea Spa/ })).toBeInTheDocument()
  })

  it('Esc fecha o tour, destrói o viewer e devolve o foco ao CTA que abriu', async () => {
    const usuario = userEvent.setup()
    const { container } = render(<Percurso areas={areasDoNavio} />)
    const cta = within(paradas(container).find((s) => s.id === 'piscinas')!).getByRole('button', { name: 'Ver em 360°' })
    await usuario.click(cta)
    await waitFor(() => expect(ViewerMock).toHaveBeenCalled())
    await usuario.keyboard('{Escape}')
    expect(destroy).toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(cta).toHaveFocus()
  })

  it('trocar de área abre o tour da nova área', async () => {
    const usuario = userEvent.setup()
    const { container } = render(<Percurso areas={areasDoNavio} />)
    const botaoDe = (id: string) =>
      within(paradas(container).find((s) => s.id === id)!).getByRole('button', { name: 'Ver em 360°' })
    await usuario.click(botaoDe('recepcao'))
    await usuario.keyboard('{Escape}')
    await usuario.click(botaoDe('buffet'))
    await waitFor(() => expect(ViewerMock).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('dialog', { name: /Calumet Buffet/ })).toBeInTheDocument()
  })

  it('sem WebGL mostra a foto plana com aviso', async () => {
    vi.mocked(suportaWebGL).mockReturnValue(false)
    const usuario = userEvent.setup()
    const { container } = render(<Percurso areas={areasDoNavio} />)
    await usuario.click(within(paradas(container)[0]).getByRole('button', { name: 'Ver em 360°' }))
    expect(ViewerMock).not.toHaveBeenCalled()
    expect(await screen.findByRole('status')).toHaveTextContent(/360°/)
  })
})

describe('movimento reduzido', () => {
  beforeEach(() => mockMatchMedia(true))

  it('mostra a lista estática com a foto plana, título, metadados, descrição e CTA de cada área', () => {
    const fromTo = vi.spyOn(gsap, 'fromTo')
    const { container } = render(<Percurso areas={areasDoNavio} />)
    expect(container.querySelector('.percurso')).toHaveAttribute('data-estatico', 'true')
    expect(container.querySelector('.percurso__palco')).toBeNull()
    expect(fromTo).not.toHaveBeenCalled()
    expect(ScrollTrigger.getAll()).toHaveLength(0)
    expect(observers).toHaveLength(0)

    expect(paradas(container).map((s) => s.id)).toEqual(areasDoNavio.map((a) => a.id))
    const secao = paradas(container).find((s) => s.id === 'aurea-spa')!
    expect(within(secao).getByRole('img', { name: 'Aurea Spa' })).toHaveAttribute('src', spa.imagem)
    expect(within(secao).getByRole('heading', { name: spa.titulo })).toBeInTheDocument()
    expect(within(secao).getByText(`Aurea Spa · Deck ${spa.deck}`)).toBeInTheDocument()
    expect(within(secao).getByText(spa.descricao)).toBeVisible()
    expect(within(secao).getByRole('button', { name: 'Ver em 360°' })).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(areasDoNavio.length)
  })

  it('o modal funciona igual', async () => {
    const usuario = userEvent.setup()
    const { container } = render(<Percurso areas={areasDoNavio} />)
    const cta = within(paradas(container).find((s) => s.id === 'aurea-spa')!).getByRole('button', { name: 'Ver em 360°' })
    await usuario.click(cta)
    await waitFor(() => expect(ViewerMock).toHaveBeenCalledWith(expect.objectContaining({ panorama: spa.cenas![0].panorama })))
    await usuario.keyboard('{Escape}')
    expect(cta).toHaveFocus()
  })
})
