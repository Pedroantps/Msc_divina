import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { escolherCapacidade, useCapacidade3D, type SinaisDispositivo } from './useCapacidade3D'

const base: SinaisDispositivo = { webgl: true, maxTextura: 16384, memoriaGb: 8, economiaDados: false, toqueGrosso: false }

describe('escolherCapacidade', () => {
  it('sem WebGL cai para sem3d', () => {
    expect(escolherCapacidade({ ...base, webgl: false })).toBe('sem3d')
  })
  it('economia de dados cai para sem3d', () => {
    expect(escolherCapacidade({ ...base, economiaDados: true })).toBe('sem3d')
  })
  it('textura máxima menor que 2048 cai para sem3d', () => {
    expect(escolherCapacidade({ ...base, maxTextura: 1024 })).toBe('sem3d')
  })
  it('textura máxima entre 2048 e 4095 é media', () => {
    expect(escolherCapacidade({ ...base, maxTextura: 2048 })).toBe('media')
    expect(escolherCapacidade({ ...base, maxTextura: 4095 })).toBe('media')
  })
  it('memória de até 4 GB é media', () => {
    expect(escolherCapacidade({ ...base, memoriaGb: 4 })).toBe('media')
  })
  it('toque grosso é media', () => {
    expect(escolherCapacidade({ ...base, toqueGrosso: true })).toBe('media')
  })
  it('desktop com 8 GB e textura 16384 é alta', () => {
    expect(escolherCapacidade(base)).toBe('alta')
  })
  it('memória indefinida não rebaixa', () => {
    expect(escolherCapacidade({ ...base, memoriaGb: undefined })).toBe('alta')
  })
})

describe('useCapacidade3D', () => {
  it('em jsdom, sem WebGL, devolve sem3d', () => {
    const { result } = renderHook(() => useCapacidade3D())
    expect(result.current).toBe('sem3d')
  })
})

describe('useCapacidade3D com WebGL', () => {
  afterEach(() => vi.restoreAllMocks())

  it('sonda com um único contexto e o solta depois de ler', () => {
    const loseContext = vi.fn()
    const gl = { MAX_TEXTURE_SIZE: 1, getParameter: () => 16384, getExtension: () => ({ loseContext }) }
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(gl as never)
    const { result } = renderHook(() => useCapacidade3D())
    expect(getContext).toHaveBeenCalledTimes(1)
    expect(loseContext).toHaveBeenCalledTimes(1)
    expect(['alta', 'media']).toContain(result.current)
  })
})
