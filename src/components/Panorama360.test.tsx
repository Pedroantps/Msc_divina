import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Viewer } from '@photo-sphere-viewer/core'
import { suportaWebGL } from '../lib/suportaWebGL'
import { Panorama360 } from './Panorama360'

vi.mock('../lib/suportaWebGL', () => ({ suportaWebGL: vi.fn(() => true) }))
vi.mock('@photo-sphere-viewer/core', () => ({ Viewer: vi.fn() }))
vi.mock('@photo-sphere-viewer/core/index.css', () => ({}))
vi.mock('@photo-sphere-viewer/gyroscope-plugin', () => ({ GyroscopePlugin: class GyroscopePlugin {} }))

const ViewerMock = vi.mocked(Viewer) as unknown as ReturnType<typeof vi.fn>
const destroy = vi.fn()
const setPanorama = vi.fn(() => Promise.resolve(true))
const giroToggle = vi.fn()
const giroSuportado = vi.fn(() => Promise.resolve(true))
const listeners: Record<string, () => void> = {}
const giroListeners: Record<string, (e: { gyroscopeEnabled: boolean }) => void> = {}

beforeEach(() => {
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
})

const montar = (props: Partial<React.ComponentProps<typeof Panorama360>> = {}) =>
  render(<Panorama360 ativo panorama="/pano/piscina.webp" imagemPlana="/img/piscina.webp" alt="Piscina" {...props} />)

it('mostra a foto plana enquanto inativo, sem criar o viewer', () => {
  montar({ ativo: false })
  expect(screen.getByRole('img', { name: 'Piscina' })).toBeInTheDocument()
  expect(ViewerMock).not.toHaveBeenCalled()
})

it('cria o viewer quando ativo e mostra a dica', async () => {
  montar()
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

it('só cria o viewer com o container já renderizado e conectado ao documento', async () => {
  let conectado = false
  ViewerMock.mockImplementationOnce(function (config: { container: HTMLElement }) {
    conectado = config.container.isConnected
    return { destroy, setPanorama, addEventListener: () => {} }
  })
  montar()
  await waitFor(() => expect(ViewerMock).toHaveBeenCalledTimes(1))
  expect(conectado).toBe(true)
  expect(await screen.findByRole('group', { name: 'Piscina' })).toBeInTheDocument()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

it('ativar depois de montado inativo (imports já em cache) não marca falha', async () => {
  const { rerender } = montar({ ativo: false })
  await new Promise((r) => setTimeout(r, 20))
  rerender(<Panorama360 ativo panorama="/pano/piscina.webp" imagemPlana="/img/piscina.webp" alt="Piscina" />)
  expect(await screen.findByRole('group', { name: 'Piscina' })).toBeInTheDocument()
  await waitFor(() => expect(ViewerMock).toHaveBeenCalledTimes(1))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

it('em tela de toque a dica fala em dois dedos', async () => {
  const mm = window.matchMedia
  window.matchMedia = ((q: string) => ({ matches: q === '(pointer: coarse)' })) as unknown as typeof window.matchMedia
  try {
    montar()
    expect(await screen.findByText('Use dois dedos para olhar em volta')).toBeInTheDocument()
  } finally {
    window.matchMedia = mm
  }
})

it('sem WebGL fica na foto plana', async () => {
  vi.mocked(suportaWebGL).mockReturnValue(false)
  montar()
  await new Promise((r) => setTimeout(r, 20))
  expect(ViewerMock).not.toHaveBeenCalled()
  expect(screen.getByRole('img', { name: 'Piscina' })).toBeInTheDocument()
})

it('se o viewer der erro ao iniciar, volta para a foto plana', async () => {
  ViewerMock.mockImplementationOnce(() => {
    throw new Error('webgl lost')
  })
  montar()
  await waitFor(() => expect(ViewerMock).toHaveBeenCalled())
  await waitFor(() => expect(screen.getByRole('img', { name: 'Piscina' })).toBeInTheDocument())
})

it('se o panorama falhar ao carregar, mostra a foto plana dessa cena e mantém o viewer', async () => {
  montar()
  await waitFor(() => expect(listeners['panorama-error']).toBeDefined())
  act(() => listeners['panorama-error']())
  expect(destroy).not.toHaveBeenCalled()
  expect(screen.getByRole('img', { name: 'Piscina' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent(/360°/)
})

it('um panorama que falha na troca de cena não derruba o viewer nem as outras cenas', async () => {
  const cenaA = (props: Partial<React.ComponentProps<typeof Panorama360>> = {}) => (
    <Panorama360 ativo panorama="/pano/a.webp" imagemPlana="/img/a.webp" alt="Cena A" yaw={0} {...props} />
  )
  const { rerender } = render(cenaA())
  await screen.findByRole('group', { name: 'Cena A' })
  await waitFor(() => expect(listeners['panorama-error']).toBeDefined())
  rerender(cenaA({ panorama: '/pano/b.webp', imagemPlana: '/img/b.webp', alt: 'Cena B' }))
  await waitFor(() => expect(setPanorama).toHaveBeenCalledTimes(1))
  act(() => listeners['panorama-error']())
  expect(destroy).not.toHaveBeenCalled()
  expect(screen.getByRole('img', { name: 'Cena B' })).toHaveAttribute('src', '/img/b.webp')
  expect(screen.getByRole('status')).toBeInTheDocument()
  // outra cena: o aviso some e o viewer continua o mesmo
  rerender(cenaA({ panorama: '/pano/c.webp', imagemPlana: '/img/c.webp', alt: 'Cena C' }))
  await waitFor(() => expect(setPanorama).toHaveBeenCalledTimes(2))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  expect(screen.queryByRole('img', { name: 'Cena C' })).not.toBeInTheDocument()
  expect(ViewerMock).toHaveBeenCalledTimes(1)
  expect(destroy).not.toHaveBeenCalled()
})

it('se o contexto WebGL for perdido, destrói o viewer e fica na foto plana', async () => {
  const { container } = montar()
  await waitFor(() => expect(container.querySelector('canvas')).not.toBeNull())
  act(() => {
    container.querySelector('canvas')!.dispatchEvent(new Event('webglcontextlost'))
  })
  expect(destroy).toHaveBeenCalled()
  expect(screen.getByRole('img', { name: 'Piscina' })).toBeInTheDocument()
})

it('a visão 360 ativa tem nome acessível', async () => {
  montar()
  expect(await screen.findByRole('group', { name: 'Piscina' })).toBeInTheDocument()
})

it('destrói o viewer ao desmontar', async () => {
  const { unmount } = montar()
  await waitFor(() => expect(ViewerMock).toHaveBeenCalled())
  unmount()
  expect(destroy).toHaveBeenCalled()
})

it('não cria o viewer se desmontar antes do import resolver', async () => {
  const { unmount } = montar()
  unmount()
  await new Promise((r) => setTimeout(r, 20))
  expect(ViewerMock).not.toHaveBeenCalled()
})

it('sem WebGL mostra um aviso curto junto da foto plana', async () => {
  vi.mocked(suportaWebGL).mockReturnValue(false)
  montar()
  expect(await screen.findByRole('status')).toHaveTextContent(/360°/)
})

describe('liga e desliga por `ativo`', () => {
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

  it('liga e desliga só pela prop', async () => {
    const { rerender } = render(tour({ ativo: false }))
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
