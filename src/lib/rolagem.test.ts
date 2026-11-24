import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const instancias: Array<Record<string, ReturnType<typeof vi.fn>>> = []
const opcoesCriacao: unknown[] = []

vi.mock('lenis', () => ({
  default: class {
    scrollTo = vi.fn()
    stop = vi.fn()
    start = vi.fn()
    destroy = vi.fn()
    raf = vi.fn()
    on = vi.fn()
    off = vi.fn()
    constructor(opcoes: unknown) {
      opcoesCriacao.push(opcoes)
      instancias.push(this as unknown as Record<string, ReturnType<typeof vi.fn>>)
    }
  },
}))

import { gsap } from './gsap'
import { iniciarRolagemSuave, pausarRolagem, retomarRolagem, rolarPara, rolarParaPosicao } from './rolagem'

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  instancias.length = 0
  opcoesCriacao.length = 0
  document.body.innerHTML = '<section id="x"></section>'
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('rolagem suave', () => {
  it('registra no ticker e a limpeza remove e destrói', () => {
    const add = vi.spyOn(gsap.ticker, 'add')
    const remove = vi.spyOn(gsap.ticker, 'remove')
    const lag = vi.spyOn(gsap.ticker, 'lagSmoothing')
    const limpar = iniciarRolagemSuave()
    expect(add).toHaveBeenCalledTimes(1)
    expect(lag).toHaveBeenCalledWith(0)
    expect(opcoesCriacao[0]).toMatchObject({ lerp: 0.1, smoothWheel: true, syncTouch: false })
    limpar()
    expect(remove).toHaveBeenCalledWith(add.mock.calls[0][0])
    expect(instancias[0].destroy).toHaveBeenCalled()
  })

  it('rolarPara usa lenis.scrollTo com offset para bloco center', () => {
    const limpar = iniciarRolagemSuave()
    const alvo = document.getElementById('x')!
    alvo.getBoundingClientRect = () => ({ height: 200 }) as DOMRect
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    rolarPara('#x', { bloco: 'center' })
    expect(instancias[0].scrollTo).toHaveBeenCalledWith(alvo, { offset: -300, immediate: false })
    rolarPara(alvo, { imediato: true })
    expect(instancias[0].scrollTo).toHaveBeenLastCalledWith(alvo, { offset: 0, immediate: true })
    limpar()
  })

  it('sem Lenis cai em scrollIntoView', () => {
    const alvo = document.getElementById('x')!
    alvo.scrollIntoView = vi.fn()
    rolarPara('#x', { bloco: 'center' })
    expect(alvo.scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'auto' })
    expect(() => {
      pausarRolagem()
      retomarRolagem()
    }).not.toThrow()
  })

  it('rolarParaPosicao pula direto: Lenis com immediate, sem Lenis window.scrollTo', () => {
    const nativo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    rolarParaPosicao(1234)
    expect(nativo).toHaveBeenCalledWith({ top: 1234, behavior: 'auto' })
    const limpar = iniciarRolagemSuave()
    rolarParaPosicao(567)
    expect(instancias[0].scrollTo).toHaveBeenCalledWith(567, { immediate: true })
    limpar()
  })

  it('sem ResizeObserver não cria o Lenis', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const limpar = iniciarRolagemSuave()
    expect(instancias).toHaveLength(0)
    limpar()
  })

  it('pausar e retomar chamam stop e start', () => {
    const limpar = iniciarRolagemSuave()
    pausarRolagem()
    retomarRolagem()
    expect(instancias[0].stop).toHaveBeenCalled()
    expect(instancias[0].start).toHaveBeenCalled()
    limpar()
  })
})
