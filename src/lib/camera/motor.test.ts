import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PerspectiveCamera, ShaderMaterial, SphereGeometry, Texture } from 'three'
import { criarMotor } from './motor'
import type { Motor, OpcoesMotor } from './motor'
import type { EstadoCamera, Vista } from './tipos'

/** WebGLRenderer falso: só registra as chamadas (jsdom não tem WebGL). */
const renderers: RendererFalso[] = []
class RendererFalso {
  autoClear = true
  capabilities = { getMaxAnisotropy: () => 8 }
  initTexture = vi.fn()
  render = vi.fn()
  clear = vi.fn()
  dispose = vi.fn()
  setSize = vi.fn()
  setPixelRatio = vi.fn()
  setClearColor = vi.fn()
  getContext = vi.fn(() => ({}))
  constructor() {
    renderers.push(this)
  }
}

vi.mock('three', async (original) => ({
  ...(await original<typeof import('three')>()),
  WebGLRenderer: vi.fn(function (this: unknown) {
    return new RendererFalso()
  }),
}))

/** Fila manual de requestAnimationFrame. */
let quadros: Map<number, FrameRequestCallback>
let proximoQuadro: number
function rodarQuadros() {
  const fila = [...quadros.values()]
  quadros.clear()
  for (const fn of fila) fn(0)
}

interface Pedido {
  url: string
  sinal: AbortSignal
  resolver: (t: Texture) => void
}

const urls = Array.from({ length: 14 }, (_, i) => `/pano/${i}.webp`)

function montar(extra: Partial<OpcoesMotor> = {}) {
  const canvas = document.createElement('canvas')
  const pedidos: Pedido[] = []
  const carregador = vi.fn(
    (url: string, sinal: AbortSignal) =>
      new Promise<Texture>((resolver) => {
        pedidos.push({ url, sinal, resolver })
      }),
  )
  const aoFalhar = vi.fn()
  const aoPronto = vi.fn()
  const motor: Motor = criarMotor(canvas, urls, { dpr: 1, aoFalhar, aoPronto, carregador, ...extra })
  const renderer = renderers[renderers.length - 1]
  const pedidosDe = () => carregador.mock.calls.map(([url]) => Number(/\/(\d+)\.webp/.exec(url)![1]))
  const pedido = (i: number) => pedidos.find((p) => p.url === urls[i])!
  return { canvas, motor, renderer, carregador, pedidos, pedidosDe, pedido, aoFalhar, aoPronto }
}

const vista = (cena: number, fov = 95): Vista => ({ cena, yaw: 0, pitch: 0, fov })
const estado = (cena: number, fov = 95): EstadoCamera => ({ a: vista(cena, fov), b: null, mistura: 0 })

beforeEach(() => {
  renderers.length = 0
  quadros = new Map()
  proximoQuadro = 1
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
    const id = proximoQuadro++
    quadros.set(id, fn)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    quadros.delete(id)
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('criarMotor', () => {
  it('webglcontextlost no canvas chama aoFalhar uma vez', () => {
    const { canvas, aoFalhar } = montar()
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
    expect(aoFalhar).toHaveBeenCalledTimes(1)
  })

  it('redimensionar ajusta o aspect das câmeras e a projeção', () => {
    const atualizar = vi.spyOn(PerspectiveCamera.prototype, 'updateProjectionMatrix')
    const { motor, renderer } = montar()
    atualizar.mockClear()
    motor.redimensionar(800, 400)
    expect(renderer.setSize).toHaveBeenCalledWith(800, 400, false)
    expect(atualizar).toHaveBeenCalledTimes(2)
    for (const camera of atualizar.mock.contexts as PerspectiveCamera[]) expect(camera.aspect).toBe(2)
  })

  it('destruir faz dispose de materiais, geometria e renderer e solta o listener', () => {
    const material = vi.spyOn(ShaderMaterial.prototype, 'dispose')
    const geometria = vi.spyOn(SphereGeometry.prototype, 'dispose')
    const { canvas, motor, renderer, aoFalhar } = montar()
    motor.destruir()
    expect(material).toHaveBeenCalledTimes(2)
    expect(geometria).toHaveBeenCalledTimes(1)
    expect(renderer.dispose).toHaveBeenCalledTimes(1)
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
    expect(aoFalhar).not.toHaveBeenCalled()
  })

  it('definirEstado igual ao anterior não agenda render', () => {
    const { motor } = montar()
    motor.definirEstado(estado(0))
    expect(quadros.size).toBe(1)
    rodarQuadros()
    motor.definirEstado(estado(0))
    expect(quadros.size).toBe(0)
  })

  it('usa o carregador injetado e pede a cena atual', () => {
    const { motor, pedidosDe } = montar()
    motor.definirEstado(estado(3))
    expect(pedidosDe()[0]).toBe(3)
  })
})
