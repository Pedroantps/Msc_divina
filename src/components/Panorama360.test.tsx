import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Viewer } from '@photo-sphere-viewer/core'
import { suportaWebGL } from '../lib/suportaWebGL'
import { Panorama360 } from './Panorama360'

vi.mock('../lib/suportaWebGL', () => ({ suportaWebGL: vi.fn(() => true) }))
vi.mock('@photo-sphere-viewer/core', () => ({ Viewer: vi.fn() }))
vi.mock('@photo-sphere-viewer/core/index.css', () => ({}))
vi.mock('@photo-sphere-viewer/gyroscope-plugin', () => ({ GyroscopePlugin: class GyroscopePlugin {} }))

const ViewerMock = vi.mocked(Viewer) as unknown as ReturnType<typeof vi.fn>
interface Obs {
  cb: IntersectionObserverCallback
  margem: string | undefined
  observe: ReturnType<typeof vi.fn>
}
let observers: Obs[] = []
const disconnect = vi.fn()
const destroy = vi.fn()
const setPanorama = vi.fn(() => Promise.resolve(true))
const giroToggle = vi.fn()
const giroSuportado = vi.fn(() => Promise.resolve(true))
const listeners: Record<string, () => void> = {}
const giroListeners: Record<string, (e: { gyroscopeEnabled: boolean }) => void> = {}
const original = window.IntersectionObserver

beforeEach(() => {
  observers = []
  disconnect.mockClear()
  destroy.mockClear()
  setPanorama.mockClear()
  giroToggle.mockClear()
  ViewerMock.mockReset()
  for (const k of Object.keys(listeners)) delete listeners[k]
  ViewerMock.mockImplementation(function (config: { container: HTMLElement }) {
    const canvas = document.createElement('canvas')
    canvas.className = 'psv-canvas'
    ;(config.container as HTMLElement).appendChild(canvas)
    return {
      destroy,
      setPanorama,
      getPlugin: () => ({
        isSupported: giroSuportado,
        toggle: giroToggle,
        addEventListener: (nome: string, fn: (e: { gyroscopeEnabled: boolean }) => void) => {
          giroListeners[nome] = fn
        },
      }),
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
        mousewheel: false,
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

it('sem WebGL mostra um aviso curto junto da foto plana', async () => {
  vi.mocked(suportaWebGL).mockReturnValue(false)
  montar()
  entrar()
  expect(await screen.findByRole('status')).toHaveTextContent(/360°/)
})

describe('controlado por `ativo`', () => {
  const tour = (props: Partial<React.ComponentProps<typeof Panorama360>> = {}) => (
    <Panorama360
      panorama="/pano/a.webp"
      imagemPlana="/img/a.webp"
      alt="Cena A"
      yaw={10}
      ativo
      rolagemZoom
      {...props}
    />
  )

  it('não observa a tela: liga e desliga só pela prop', async () => {
    const { rerender } = render(tour({ ativo: false }))
    expect(observers).toHaveLength(0)
    expect(ViewerMock).not.toHaveBeenCalled()
    rerender(tour({ ativo: true }))
    await waitFor(() =>
      expect(ViewerMock).toHaveBeenCalledWith(
        expect.objectContaining({ panorama: '/pano/a.webp', defaultYaw: '10deg', mousewheel: true }),
      ),
    )
    rerender(tour({ ativo: false }))
    expect(destroy).toHaveBeenCalled()
    expect(screen.getByRole('img', { name: 'Cena A' })).toBeInTheDocument()
  })

  it('trocar panorama e yaw usa setPanorama sem recriar o viewer', async () => {
    const { rerender } = render(tour())
    await waitFor(() => expect(ViewerMock).toHaveBeenCalledTimes(1))
    await screen.findByRole('group', { name: 'Cena A' })
    expect(setPanorama).not.toHaveBeenCalled()
    rerender(tour({ panorama: '/pano/b.webp', yaw: 36.9, alt: 'Cena B' }))
    await waitFor(() =>
      expect(setPanorama).toHaveBeenCalledWith(
        '/pano/b.webp',
        expect.objectContaining({ position: { yaw: '36.9deg', pitch: 0 } }),
      ),
    )
    expect(ViewerMock).toHaveBeenCalledTimes(1)
    expect(destroy).not.toHaveBeenCalled()
  })

  it('mousewheel fica desligado por padrão', async () => {
    render(tour({ rolagemZoom: undefined }))
    await waitFor(() => expect(ViewerMock).toHaveBeenCalledWith(expect.objectContaining({ mousewheel: false })))
  })

  it('o botão "Mover o celular" só aparece em tela de toque e liga o giroscópio', async () => {
    const mm = window.matchMedia
    window.matchMedia = ((q: string) => ({ matches: q === '(pointer: coarse)' })) as unknown as typeof window.matchMedia
    try {
      render(tour({ giroscopio: true }))
      const botao = await screen.findByRole('button', { name: 'Mover o celular' })
      expect(ViewerMock).toHaveBeenCalledWith(expect.objectContaining({ plugins: expect.any(Array) }))
      fireEvent.click(botao)
      expect(giroToggle).toHaveBeenCalled()
      act(() => giroListeners['gyroscope-updated']({ gyroscopeEnabled: true }))
      expect(botao).toHaveAttribute('aria-pressed', 'true')
    } finally {
      window.matchMedia = mm
    }
  })

  it('sem toque não carrega o giroscópio nem mostra o botão', async () => {
    render(tour({ giroscopio: true }))
    await screen.findByRole('group', { name: 'Cena A' })
    expect(screen.queryByRole('button', { name: 'Mover o celular' })).not.toBeInTheDocument()
    expect(ViewerMock).toHaveBeenCalledWith(expect.not.objectContaining({ plugins: expect.anything() }))
  })

  it('giroscópio sem suporte no aparelho não mostra o botão', async () => {
    giroSuportado.mockResolvedValueOnce(false)
    const mm = window.matchMedia
    window.matchMedia = ((q: string) => ({ matches: q === '(pointer: coarse)' })) as unknown as typeof window.matchMedia
    try {
      render(tour({ giroscopio: true }))
      await screen.findByRole('group', { name: 'Cena A' })
      await new Promise((r) => setTimeout(r, 20))
      expect(screen.queryByRole('button', { name: 'Mover o celular' })).not.toBeInTheDocument()
    } finally {
      window.matchMedia = mm
    }
  })
})
