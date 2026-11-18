import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Viewer } from '@photo-sphere-viewer/core'
import { suportaWebGL } from '../lib/suportaWebGL'
import { Panorama360 } from './Panorama360'

vi.mock('../lib/suportaWebGL', () => ({ suportaWebGL: vi.fn(() => true) }))
vi.mock('@photo-sphere-viewer/core', () => ({ Viewer: vi.fn() }))
vi.mock('@photo-sphere-viewer/core/index.css', () => ({}))

const ViewerMock = vi.mocked(Viewer) as unknown as ReturnType<typeof vi.fn>
let callback: IntersectionObserverCallback | null = null
const disconnect = vi.fn()
const destroy = vi.fn()
const listeners: Record<string, () => void> = {}
const original = window.IntersectionObserver

beforeEach(() => {
  callback = null
  disconnect.mockClear()
  destroy.mockClear()
  ViewerMock.mockReset()
  for (const k of Object.keys(listeners)) delete listeners[k]
  ViewerMock.mockImplementation(function () {
    return {
      destroy,
      addEventListener: (nome: string, fn: () => void) => {
        listeners[nome] = fn
      },
    }
  })
  vi.mocked(suportaWebGL).mockReturnValue(true)
  window.IntersectionObserver = vi.fn(function (cb: IntersectionObserverCallback) {
    callback = cb
    return { observe: vi.fn(), unobserve: vi.fn(), disconnect, takeRecords: () => [] }
  }) as unknown as typeof IntersectionObserver
})

afterEach(() => {
  window.IntersectionObserver = original
})

function entrar() {
  act(() => {
    callback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
  })
}

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
        defaultZoomLvl: 0,
      }),
    ),
  )
  expect(disconnect).toHaveBeenCalled()
  const dica = await screen.findByText('Arraste para olhar em volta')
  fireEvent.pointerDown(dica.parentElement!)
  expect(screen.queryByText('Arraste para olhar em volta')).not.toBeInTheDocument()
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
