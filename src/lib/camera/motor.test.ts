import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Mesh, PerspectiveCamera, Scene, ShaderMaterial, SphereGeometry, Texture } from 'three'
import { criarMotor } from './motor'
import { criarMaterialPanorama, descartarTextura } from './shader'
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

/** Fila manual de requestIdleCallback. */
let ociosos: Map<number, IdleRequestCallback>
let opcoesOcioso: (IdleRequestOptions | undefined)[]
let proximoOcioso: number
function rodarOcioso() {
  const fila = [...ociosos.values()]
  ociosos.clear()
  for (const fn of fila) fn({ didTimeout: false, timeRemaining: () => 50 })
}

const microtarefas = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve()
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
  ociosos = new Map()
  proximoOcioso = 1
  opcoesOcioso = []
  vi.stubGlobal('requestIdleCallback', (fn: IdleRequestCallback, opcoes?: IdleRequestOptions) => {
    opcoesOcioso.push(opcoes)
    const id = proximoOcioso++
    ociosos.set(id, fn)
    return id
  })
  vi.stubGlobal('cancelIdleCallback', (id: number) => {
    ociosos.delete(id)
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

  describe('upload das texturas', () => {
    it('envia a textura à GPU no tempo ocioso, antes de qualquer render que a use', async () => {
      const { motor, renderer, pedido } = montar()
      const vistas: unknown[] = []
      renderer.render.mockImplementation((cena: Scene) => {
        vistas.push(((cena.children[0] as Mesh).material as ShaderMaterial).uniforms.uTextura.value)
      })
      motor.definirEstado(estado(0))
      const tex = new Texture()
      pedido(0).resolver(tex)
      await microtarefas()
      rodarQuadros()
      expect(vistas).not.toContain(tex)
      expect(renderer.initTexture).not.toHaveBeenCalled()

      rodarOcioso()
      expect(renderer.initTexture).toHaveBeenCalledWith(tex)
      rodarQuadros()
      expect(vistas).toContain(tex)
      const primeiroRender = renderer.render.mock.invocationCallOrder[vistas.indexOf(tex)]
      expect(renderer.initTexture.mock.invocationCallOrder[0]).toBeLessThan(primeiroRender)
    })

    it('o upload ocioso tem prazo de 500 ms', async () => {
      const { motor, pedido } = montar()
      motor.definirEstado(estado(0))
      pedido(0).resolver(new Texture())
      await microtarefas()
      expect(opcoesOcioso).toEqual([{ timeout: 500 }])
    })

    it('envia uma textura por vez, a da cena atual primeiro', async () => {
      const { motor, renderer, pedido } = montar()
      motor.definirEstado(estado(5))
      const t4 = new Texture()
      const t5 = new Texture()
      pedido(4).resolver(t4)
      pedido(5).resolver(t5)
      await microtarefas()
      rodarOcioso()
      expect(renderer.initTexture.mock.calls.map(([t]) => t)).toEqual([t5])
      rodarOcioso()
      expect(renderer.initTexture.mock.calls.map(([t]) => t)).toEqual([t5, t4])
    })

    it('sem requestIdleCallback, usa setTimeout', async () => {
      vi.stubGlobal('requestIdleCallback', undefined)
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      try {
        const { motor, renderer, pedido } = montar()
        motor.definirEstado(estado(0))
        const tex = new Texture()
        pedido(0).resolver(tex)
        await microtarefas()
        expect(renderer.initTexture).not.toHaveBeenCalled()
        vi.advanceTimersByTime(0)
        expect(renderer.initTexture).toHaveBeenCalledWith(tex)
      } finally {
        vi.useRealTimers()
      }
    })

    it('textura descartada antes do upload não sobe', async () => {
      const { motor, renderer, pedido } = montar()
      motor.definirEstado(estado(0))
      const t1 = new Texture()
      pedido(1).resolver(t1)
      await microtarefas()
      motor.destruir()
      rodarOcioso()
      expect(renderer.initTexture).not.toHaveBeenCalledWith(t1)
    })
  })

  describe('bitmap após o upload', () => {
    it('fecha o bitmap e solta a imagem depois do initTexture', async () => {
      const { motor, renderer, pedido } = montar()
      motor.definirEstado(estado(0))
      const close = vi.fn()
      const tex = new Texture({ width: 4096, height: 2048, close } as unknown as ImageBitmap)
      pedido(0).resolver(tex)
      await microtarefas()
      expect(close).not.toHaveBeenCalled()
      rodarOcioso()
      expect(close).toHaveBeenCalledTimes(1)
      expect(close.mock.invocationCallOrder[0]).toBeGreaterThan(renderer.initTexture.mock.invocationCallOrder[0])
      expect(tex.image).toBeNull()
    })

    it('descartarTextura aceita textura sem imagem', () => {
      const tex = new Texture()
      tex.image = null
      const dispose = vi.spyOn(tex, 'dispose')
      expect(() => descartarTextura(tex)).not.toThrow()
      expect(dispose).toHaveBeenCalled()
    })
  })

  describe('foco das texturas', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('o primeiro estado foca na hora', () => {
      const { motor, pedidosDe } = montar()
      motor.definirEstado(estado(4))
      expect(pedidosDe().sort((x, y) => x - y)).toEqual([3, 4, 5])
    })

    it('salto rápido 0→10 em menos de 120 ms pede só 0 e depois 10±1', () => {
      const { motor, pedidosDe } = montar()
      motor.definirEstado(estado(0))
      for (let cena = 1; cena <= 10; cena++) {
        vi.advanceTimersByTime(10)
        motor.definirEstado(estado(cena))
      }
      expect(pedidosDe().sort((x, y) => x - y)).toEqual([0, 1])
      vi.advanceTimersByTime(119)
      expect(pedidosDe()).toHaveLength(2)
      vi.advanceTimersByTime(1)
      expect(pedidosDe().sort((x, y) => x - y)).toEqual([0, 1, 9, 10, 11])
    })

    it('estados da mesma cena (só yaw mudando) não adiam o foco pendente', () => {
      const { motor, pedidosDe } = montar()
      motor.definirEstado(estado(3))
      motor.definirEstado(estado(4))
      for (let t = 16; t <= 112; t += 16) {
        vi.advanceTimersByTime(16)
        motor.definirEstado({ a: { ...vista(4), yaw: t }, b: null, mistura: 0 })
      }
      expect(pedidosDe()).not.toContain(5)
      vi.advanceTimersByTime(120 - 112)
      expect(pedidosDe()).toContain(5)
    })

    it('voltar à cena focada antes dos 120 ms cancela o foco pendente', () => {
      const { motor, pedidosDe } = montar()
      motor.definirEstado(estado(3))
      motor.definirEstado(estado(8))
      motor.definirEstado(estado(3))
      vi.advanceTimersByTime(500)
      expect(pedidosDe().sort((x, y) => x - y)).toEqual([2, 3, 4])
    })

    it('liberar() descarta tudo e o definirEstado seguinte recarrega', async () => {
      const descartar = vi.spyOn(Texture.prototype, 'dispose')
      const { motor, pedido, pedidosDe, carregador, aoPronto } = montar()
      motor.definirEstado(estado(0))
      pedido(0).resolver(new Texture())
      await microtarefas()
      rodarOcioso()
      rodarQuadros()
      expect(aoPronto).toHaveBeenLastCalledWith(true, { aPronta: true })

      motor.liberar()
      expect(descartar).toHaveBeenCalledTimes(1)
      expect(pedido(1).sinal.aborted).toBe(true)
      expect(aoPronto).toHaveBeenLastCalledWith(false, { aPronta: false })

      carregador.mockClear()
      motor.definirEstado(estado(0))
      expect(pedidosDe().sort((x, y) => x - y)).toEqual([0, 1])
      expect(quadros.size).toBe(1)
    })
  })

  it('definirDpr ajusta o pixel ratio e redesenha sem recriar o renderer', () => {
    const { motor, renderer } = montar()
    motor.definirEstado(estado(0))
    rodarQuadros()
    motor.definirDpr(2)
    expect(renderer.setPixelRatio).toHaveBeenLastCalledWith(2)
    expect(quadros.size).toBe(1)
    expect(renderers).toHaveLength(1)
    rodarQuadros()
    motor.definirDpr(2)
    expect(quadros.size).toBe(0)
  })

  describe('aoPronto', () => {
    const avanco = (mistura: number): EstadoCamera => ({ a: vista(0, 60), b: vista(1, 105), mistura })

    it('fica pronto com a textura de b quando a mistura é maior que 0', async () => {
      const { motor, pedido, aoPronto } = montar()
      motor.definirEstado(avanco(0.5))
      pedido(1).resolver(new Texture())
      await microtarefas()
      rodarOcioso()
      rodarQuadros()
      expect(aoPronto).toHaveBeenLastCalledWith(true, { aPronta: false })
    })

    it('com a textura de a, avisa aPronta', async () => {
      const { motor, pedido, aoPronto } = montar()
      motor.definirEstado(avanco(0.05))
      pedido(0).resolver(new Texture())
      await microtarefas()
      rodarOcioso()
      rodarQuadros()
      expect(aoPronto).toHaveBeenLastCalledWith(true, { aPronta: true })
    })

    it('com mistura 0, só a textura de b não basta', async () => {
      const { motor, pedido, aoPronto } = montar()
      motor.definirEstado(avanco(0))
      pedido(1).resolver(new Texture())
      await microtarefas()
      rodarOcioso()
      rodarQuadros()
      expect(aoPronto).not.toHaveBeenCalledWith(true, expect.anything())
    })
  })

  describe('desfoque do avanço', () => {
    it('só a camada a desfoca; b fica sempre nítida', async () => {
      const { motor, renderer, pedido } = montar()
      const avancos: number[] = []
      renderer.render.mockImplementation((cena: Scene) => {
        avancos.push(((cena.children[0] as Mesh).material as ShaderMaterial).uniforms.uAvanco.value as number)
      })
      motor.definirEstado({ a: vista(0, 60), b: vista(1, 60), mistura: 0.5 })
      pedido(0).resolver(new Texture())
      pedido(1).resolver(new Texture())
      await microtarefas()
      rodarOcioso()
      rodarOcioso()
      rodarQuadros()
      expect(avancos).toHaveLength(2)
      expect(avancos[0]).toBeGreaterThan(0.8)
      expect(avancos[1]).toBe(0)
    })

    it('o shader usa 20 amostras com deslocamento por pixel e força quadrática', () => {
      const { fragmentShader } = criarMaterialPanorama()
      expect(fragmentShader).toMatch(/AMOSTRAS\s*=\s*20;/)
      expect(fragmentShader).toContain('gl_FragCoord')
      expect(fragmentShader).toMatch(/0\.08\s*\*\s*uAvanco\s*\*\s*uAvanco/)
    })
  })

  describe('FOV em retrato', () => {
    async function fovDesenhado(l: number, a: number, fov: number) {
      const { motor, renderer, pedido } = montar()
      const fovs: number[] = []
      renderer.render.mockImplementation((_cena: Scene, camera: PerspectiveCamera) => {
        fovs.push(camera.fov)
      })
      motor.redimensionar(l, a)
      motor.definirEstado(estado(0, fov))
      pedido(0).resolver(new Texture())
      await microtarefas()
      rodarOcioso()
      rodarQuadros()
      return fovs[fovs.length - 1]
    }

    it('em retrato (aspect 0,46) o FOV 85 vira ≈ 100', async () => {
      expect(await fovDesenhado(460, 1000, 85)).toBeCloseTo(100, 5)
    })

    it('em paisagem (aspect 1,6) o FOV fica como está', async () => {
      expect(await fovDesenhado(1600, 1000, 85)).toBe(85)
    })

    it('em retrato o FOV é limitado a 115°', async () => {
      expect(await fovDesenhado(390, 844, 110)).toBe(115)
    })
  })
})
