import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Viewer } from '@photo-sphere-viewer/core'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { suportaWebGL } from '../lib/suportaWebGL'
import { panoramaPara } from '../lib/imagens'
import { estadoNaRolagem } from '../lib/camera/coreografia'
import { roteiros } from '../data/roteiro'
import { areasDoNavio } from '../data/areas'
import type { Capacidade } from '../lib/camera/tipos'
import { Percurso } from './Percurso'
import { alvoDaParada, paradaAtiva } from './percursoUtil'

const palco = vi.hoisted(() => ({
  capacidade: 'alta' as 'alta' | 'media' | 'sem3d',
  definirEstado: vi.fn(),
  propsPanorama: null as null | { panoramas: string[]; posteres: string[]; dpr: number; aoFalhar: () => void },
  propsFotos: null as null | { imagens: string[] },
}))

vi.mock('../hooks/useCapacidade3D', () => ({ useCapacidade3D: () => palco.capacidade }))
vi.mock('./PalcoPanorama', async () => {
  const { forwardRef, useImperativeHandle } = await import('react')
  return {
    PalcoPanorama: forwardRef(function PalcoPanorama(props: NonNullable<typeof palco.propsPanorama>, ref) {
      palco.propsPanorama = props
      useImperativeHandle(ref, () => ({ definirEstado: palco.definirEstado }))
      return <div data-palco="panorama" />
    }),
  }
})
vi.mock('./PalcoFotos', async () => {
  const { forwardRef, useImperativeHandle } = await import('react')
  return {
    PalcoFotos: forwardRef(function PalcoFotos(props: NonNullable<typeof palco.propsFotos>, ref) {
      palco.propsFotos = props
      useImperativeHandle(ref, () => ({ definirEstado: palco.definirEstado }))
      return <div data-palco="fotos" />
    }),
  }
})
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
  opcoes?: IntersectionObserverInit
  observados: Element[]
}
let observers: Obs[] = []

/** Simula o Percurso entrar na folga de 1 tela. */
function chegarPerto() {
  const obs = observers.find((o) => o.opcoes?.rootMargin === '100% 0px')!
  act(() =>
    obs.cb([{ isIntersecting: true, target: obs.observados[0] } as unknown as IntersectionObserverEntry], {} as IntersectionObserver),
  )
}

beforeEach(() => {
  mockMatchMedia(false)
  observers = []
  palco.capacidade = 'alta'
  palco.propsPanorama = null
  palco.propsFotos = null
  palco.definirEstado.mockClear()
  window.IntersectionObserver = vi.fn(function (cb: IntersectionObserverCallback, opcoes?: IntersectionObserverInit) {
    const obs: Obs = { cb, opcoes, observados: [] }
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

describe('palco', () => {
  const criarGatilho = () => {
    const criar = vi.spyOn(ScrollTrigger, 'create')
    const r = render(<Percurso areas={areasDoNavio} />)
    const cfg = criar.mock.calls.map(([c]) => c).find((c) => c.scrub === true)!
    return { ...r, cfg }
  }

  it('não monta palco antes de o capítulo chegar a 1 tela de distância', () => {
    const { container } = render(<Percurso areas={areasDoNavio} />)
    expect(window.IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), { rootMargin: '100% 0px' })
    expect(container.querySelector('[data-palco]')).toBeNull()
    chegarPerto()
    expect(container.querySelector('[data-palco="panorama"]')).not.toBeNull()
  })

  it('capacidade sem3d monta o palco de fotos com as imagens das áreas', () => {
    palco.capacidade = 'sem3d'
    const { container } = render(<Percurso areas={areasDoNavio} />)
    chegarPerto()
    expect(container.querySelector('[data-palco="fotos"]')).not.toBeNull()
    expect(container.querySelector('[data-palco="panorama"]')).toBeNull()
    expect(palco.propsFotos!.imagens).toEqual(areasDoNavio.map((a) => a.imagem))
  })

  it.each([
    ['alta', 2],
    ['media', 1.5],
  ] as [Capacidade, number][])('capacidade %s monta o panorama com dpr %s', (cap, dpr) => {
    palco.capacidade = cap
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(3)
    render(<Percurso areas={areasDoNavio} />)
    chegarPerto()
    expect(palco.propsPanorama!.dpr).toBe(dpr)
    expect(palco.propsPanorama!.panoramas).toEqual(areasDoNavio.map((a) => panoramaPara(a.panorama!, cap)))
    expect(palco.propsPanorama!.posteres).toEqual(areasDoNavio.map((a) => a.imagem))
  })

  it('aoFalhar troca para o palco de fotos sem desmontar os textos', () => {
    const { container } = render(<Percurso areas={areasDoNavio} />)
    chegarPerto()
    const titulo = within(paradas(container)[0]).getByRole('heading', { level: 2 })
    act(() => palco.propsPanorama!.aoFalhar())
    expect(container.querySelector('[data-palco="fotos"]')).not.toBeNull()
    expect(container.querySelector('[data-palco="panorama"]')).toBeNull()
    expect(within(paradas(container)[0]).getByRole('heading', { level: 2 })).toBe(titulo)
  })

  it('um único ScrollTrigger com scrub no container das paradas', () => {
    const { cfg, container } = criarGatilho()
    expect(cfg.start).toBe('top top')
    expect(cfg.end).toBe('bottom bottom')
    expect(cfg.trigger).toBe(container.querySelector('.percurso__paradas'))
    expect(ScrollTrigger.getAll()).toHaveLength(1)
  })

  it('onUpdate manda estadoNaRolagem(progress * N) ao palco', () => {
    const { cfg } = criarGatilho()
    chegarPerto()
    palco.definirEstado.mockClear()
    act(() => cfg.onUpdate!({ progress: 0.5 } as ScrollTrigger))
    expect(palco.definirEstado).toHaveBeenLastCalledWith(estadoNaRolagem(0.5 * areasDoNavio.length, roteiros))
  })

  it('aceita roteiros injetados por prop', () => {
    const outros = roteiros.map((r) => ({ ...r, quadros: r.quadros.map((q) => ({ ...q, yaw: q.yaw + 10 })) }))
    const criar = vi.spyOn(ScrollTrigger, 'create')
    render(<Percurso areas={areasDoNavio} roteiros={outros} />)
    const cfg = criar.mock.calls.map(([c]) => c).find((c) => c.scrub === true)!
    chegarPerto()
    palco.definirEstado.mockClear()
    act(() => cfg.onUpdate!({ progress: 0.3 } as ScrollTrigger))
    expect(palco.definirEstado).toHaveBeenLastCalledWith(estadoNaRolagem(0.3 * areasDoNavio.length, outros))
  })

  it('o texto fica ativo só na faixa p 0,15 a 0,70 da parada', () => {
    const { cfg, container } = criarGatilho()
    const N = areasDoNavio.length
    const textos = () => Array.from(container.querySelectorAll('.parada__texto'))
    const ativos = () => textos().map((t) => t.hasAttribute('data-ativa'))
    act(() => cfg.onUpdate!({ progress: (2 + 0.05) / N } as ScrollTrigger))
    expect(ativos().some(Boolean)).toBe(false)
    act(() => cfg.onUpdate!({ progress: (2 + 0.4) / N } as ScrollTrigger))
    expect(ativos()).toEqual(textos().map((_, i) => i === 2))
    act(() => cfg.onUpdate!({ progress: (2 + 0.8) / N } as ScrollTrigger))
    expect(ativos().some(Boolean)).toBe(false)
    act(() => cfg.onUpdate!({ progress: (3 + 0.2) / N } as ScrollTrigger))
    expect(ativos()).toEqual(textos().map((_, i) => i === 3))
  })

  it('limpa o ScrollTrigger ao desmontar', () => {
    const { unmount } = render(<Percurso areas={areasDoNavio} />)
    expect(ScrollTrigger.getAll().length).toBeGreaterThan(0)
    unmount()
    expect(ScrollTrigger.getAll()).toHaveLength(0)
  })

  it('alvo do foco: progresso (i + 0,4) da janela real do ScrollTrigger, dentro do texto ativo', () => {
    const N = areasDoNavio.length
    const inicio = 1000
    const fim = inicio + (2 * N - 1) * 800
    const alvo = alvoDaParada(inicio, fim, 13, N)
    expect((alvo - inicio) / (fim - inicio)).toBeCloseTo(13.4 / N, 10)
    expect(paradaAtiva(((alvo - inicio) / (fim - inicio)) * N, N)).toBe(13)
  })

  it('foco por teclado numa parada inativa rola até o alvo do ScrollTrigger e ativa o texto na hora', () => {
    const rolar = vi.fn()
    vi.spyOn(window, 'scrollTo').mockImplementation(rolar)
    const criar = vi.spyOn(ScrollTrigger, 'create')
    const { container } = render(<Percurso areas={areasDoNavio} />)
    const st = criar.mock.results[0].value as ScrollTrigger
    const N = areasDoNavio.length
    Object.assign(st, { start: 1000, end: 1000 + (2 * N - 1) * 800 })
    const secao = paradas(container)[13]
    const botao = within(secao).getByRole('button', { name: 'Ver em 360°' })
    act(() => botao.focus())
    expect(rolar).toHaveBeenCalledTimes(1)
    expect(rolar).toHaveBeenCalledWith({ top: alvoDaParada(st.start, st.end, 13, N), behavior: 'auto' })
    expect(secao.querySelector('.parada__texto')).toHaveAttribute('data-ativa', 'true')
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
    expect(container.querySelector('[data-palco]')).toBeNull()
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
