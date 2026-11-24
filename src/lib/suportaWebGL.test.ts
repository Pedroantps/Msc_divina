import { afterEach, describe, expect, it, vi } from 'vitest'
import { sondarWebGL, suportaWebGL } from './suportaWebGL'

const loseContext = vi.fn()
const getParameter = vi.fn(() => 8192)
const gl = {
  MAX_TEXTURE_SIZE: 0x0d33,
  getParameter,
  getExtension: vi.fn((nome: string) => (nome === 'WEBGL_lose_context' ? { loseContext } : null)),
}

afterEach(() => {
  vi.restoreAllMocks()
  loseContext.mockClear()
  getParameter.mockClear()
})

describe('sondarWebGL', () => {
  it('usa um único canvas, lê a textura máxima e solta o contexto depois', () => {
    const criar = vi.spyOn(document, 'createElement')
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(gl as never)
    expect(sondarWebGL()).toEqual({ webgl: true, maxTextura: 8192 })
    expect(criar.mock.calls.filter(([t]) => t === 'canvas')).toHaveLength(1)
    expect(getContext).toHaveBeenCalledTimes(1)
    expect(loseContext).toHaveBeenCalledTimes(1)
  })

  it('sem WebGL devolve false e 0', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    expect(sondarWebGL()).toEqual({ webgl: false, maxTextura: 0 })
  })

  it('sem a extensão de perda de contexto não lança erro', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ ...gl, getExtension: () => null } as never)
    expect(() => sondarWebGL()).not.toThrow()
  })

  it('getContext que lança vira "sem WebGL"', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(sondarWebGL()).toEqual({ webgl: false, maxTextura: 0 })
  })
})

describe('suportaWebGL', () => {
  it('reflete a sondagem e também solta o contexto', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(gl as never)
    expect(suportaWebGL()).toBe(true)
    expect(loseContext).toHaveBeenCalledTimes(1)
  })
})
