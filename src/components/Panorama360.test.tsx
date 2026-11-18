import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Viewer } from '@photo-sphere-viewer/core'
import { suportaWebGL } from '../lib/suportaWebGL'
import { Panorama360 } from './Panorama360'

vi.mock('../lib/suportaWebGL', () => ({ suportaWebGL: vi.fn(() => true) }))
vi.mock('@photo-sphere-viewer/core', () => ({ Viewer: vi.fn() }))
vi.mock('@photo-sphere-viewer/core/index.css', () => ({}))

const ViewerMock = vi.mocked(Viewer) as unknown as ReturnType<typeof vi.fn>
interface Obs {
  cb: IntersectionObserverCallback
  margem: string | undefined
  observe: ReturnType<typeof vi.fn>
}
let observers: Obs[] = []
const disconnect = vi.fn()
const destroy = vi.fn()
const listeners: Record<string, () => void> = {}
const original = window.IntersectionObserver

beforeEach(() => {
  observers = []
  disconnect.mockClear()
  destroy.mockClear()
  ViewerMock.mockReset()
  for (const k of Object.keys(listeners)) delete listeners[k]
  ViewerMock.mockImplementation(function (config: { container: HTMLElement }) {
    const canvas = document.createElement('canvas')
    canvas.className = 'psv-canvas'
    ;(config.container as HTMLElement).appendChild(canvas)
    return {
      destroy,
      addEventListener: (nome: string, fn: () => void) => {
        listeners[nome] = fn
      },
    }
  })
  vi.mocked(suportaWebGL).mockReturnValue(true)
  window.IntersectionObserver = vi.fn(function (
    cb: IntersectionObserverCallback,
    opcoes?: IntersectionObserverInit,
  ) {
    const observe = vi.fn()
    observers.push({ cb, margem: opcoes?.rootMargin, observe })
    return { observe, unobserve: vi.fn(), disconnect, takeRecords: () => [] }
  }) as unknown as typeof IntersectionObserver
})

afterEach(() => {
  window.IntersectionObserver = original
})

function disparar(isIntersecting: boolean) {
  act(() => {
    for (const o of observers) {
      o.cb([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)
    }
  })
}
const entrar = () => disparar(true)
const sair = () => disparar(false)

const montar = () =>
  render(<Panorama360 panorama="/pano/piscina.webp" imagemPlana="/img/piscina.webp" alt="Piscina" />)

it('mostra a foto plana antes de entrar na tela', () => {
  montar()
  expect(screen.getByRole('img', { name: 'Piscina' })).toBeInTheDocument()
  expect(ViewerMock).not.toHaveBeenCalled()
})

it('cria o viewer quando entra na tela e mostra a dica', async () => {
  montar()
  entrar()
  await waitFor(() =>
    expect(ViewerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        panorama: '/pano/piscina.webp',
        navbar: false,
        touchmoveTwoFingers: true,
        mousewheelCtrlKey: true,
        defaultZoomLvl: 0,
        lang: expect.objectContaining({
          twoFingers: 'Use dois dedos para olhar em volta',
          ctrlZoom: expect.stringContaining('ctrl'),
          loadError: 'Não foi possível carregar o panorama',
          webglError: expect.stringContaining('WebGL'),
        }),
      }),
    ),
  )
  const dica = await screen.findByText('Arraste para olhar em volta')
  fireEvent.pointerDown(dica.parentElement!)
  expect(screen.queryByText('Arraste para olhar em volta')).not.toBeInTheDocument()
})

it('em tela de toque a dica fala em dois dedos', async () => {
  const mm = window.matchMedia
  window.matchMedia = ((q: string) => ({ matches: q === '(pointer: coarse)' })) as unknown as typeof window.matchMedia
  try {
    montar()
    entrar()
    expect(await screen.findByText('Use dois dedos para olhar em volta')).toBeInTheDocument()
  } finally {
    window.matchMedia = mm
  }
})

it('sem WebGL fica na foto plana', async () => {
  vi.mocked(suportaWebGL).mockReturnValue(false)
  montar()
  entrar()
  await new Promise((r) => setTimeout(r, 20))
  expect(ViewerMock).not.toHaveBeenCalled()
  expect(screen.getByRole('img', { name: 'Piscina' })).toBeInTheDocument()
})

it('se o viewer der erro ao iniciar, volta para a foto plana', async () => {
  ViewerMock.mockImplementationOnce(() => {
    throw new Error('webgl lost')
  })
  montar()
  entrar()
  await waitFor(() => expect(ViewerMock).toHaveBeenCalled())
  await waitFor(() => expect(screen.getByRole('img', { name: 'Piscina' })).toBeInTheDocument())
})

it('se o panorama falhar ao carregar, destrói o viewer e volta para a foto plana', async () => {
  montar()
  entrar()
  await waitFor(() => expect(listeners['panorama-error']).toBeDefined())
  act(() => listeners['panorama-error']())
  expect(destroy).toHaveBeenCalled()
  expect(screen.getByRole('img', { name: 'Piscina' })).toBeInTheDocument()
})

it('desconecta os observers ao desmontar', () => {
  const { unmount } = montar()
  unmount()
  expect(disconnect).toHaveBeenCalled()
})

it('observa o elemento âncora (a seção da área) quando informado', async () => {
  const secao = document.createElement('section')
  secao.id = 'piscina'
  document.body.appendChild(secao)
  try {
    render(<Panorama360 panorama="/pano/p.webp" imagemPlana="/img/p.webp" alt="Piscina" ancora="piscina" />)
    expect(observers.length).toBeGreaterThan(0)
    for (const o of observers) expect(o.observe).toHaveBeenCalledWith(secao)
    expect(ViewerMock).not.toHaveBeenCalled()
    entrar()
    await waitFor(() => expect(ViewerMock).toHaveBeenCalled())
  } finally {
    secao.remove()
  }
})

it('destrói o viewer e volta à foto plana quando a área sai da folga', async () => {
  montar()
  entrar()
  await waitFor(() => expect(ViewerMock).toHaveBeenCalledTimes(1))
  sair()
  expect(destroy).toHaveBeenCalled()
  expect(screen.getByRole('img', { name: 'Piscina' })).toBeInTheDocument()
  entrar()
  await waitFor(() => expect(ViewerMock).toHaveBeenCalledTimes(2))
})

it('se o contexto WebGL for perdido, destrói o viewer e fica na foto plana', async () => {
  const { container } = montar()
  entrar()
  await waitFor(() => expect(container.querySelector('canvas')).not.toBeNull())
  act(() => {
    container.querySelector('canvas')!.dispatchEvent(new Event('webglcontextlost'))
  })
  expect(destroy).toHaveBeenCalled()
  expect(screen.getByRole('img', { name: 'Piscina' })).toBeInTheDocument()
  entrar()
  await new Promise((r) => setTimeout(r, 20))
  expect(ViewerMock).toHaveBeenCalledTimes(1)
})

it('a visão 360 ativa tem nome acessível', async () => {
  montar()
  entrar()
  expect(await screen.findByRole('group', { name: 'Piscina' })).toBeInTheDocument()
})

it('destrói o viewer ao desmontar', async () => {
  const { unmount } = montar()
  entrar()
  await waitFor(() => expect(ViewerMock).toHaveBeenCalled())
  unmount()
  expect(destroy).toHaveBeenCalled()
})

it('não cria o viewer se desmontar antes do import resolver', async () => {
  const { unmount } = montar()
  entrar()
  unmount()
  await new Promise((r) => setTimeout(r, 20))
  expect(ViewerMock).not.toHaveBeenCalled()
})
