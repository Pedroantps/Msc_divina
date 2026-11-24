import { createRef } from 'react'
import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarMotor } from '../lib/camera/motor'
import type { OpcoesMotor } from '../lib/camera/motor'
import type { ControlePalco, EstadoCamera } from '../lib/camera/tipos'
import { PalcoPanorama } from './PalcoPanorama'

vi.mock('../lib/camera/motor', () => ({ criarMotor: vi.fn() }))

const criarMotorMock = vi.mocked(criarMotor)
const motor = { definirEstado: vi.fn(), redimensionar: vi.fn(), liberar: vi.fn(), destruir: vi.fn() }
let opcoesRecebidas: OpcoesMotor | undefined

/** ResizeObserver falso: guarda o callback para o teste disparar. */
let aoRedimensionar: ResizeObserverCallback | undefined
const desconectar = vi.fn()
class ResizeObserverFalso {
  constructor(fn: ResizeObserverCallback) {
    aoRedimensionar = fn
  }
  observe() {}
  unobserve() {}
  disconnect() {
    desconectar()
  }
}

const panoramas = ['/pano/a.webp', '/pano/b.webp', '/pano/c.webp']
const posteres = ['/img/a.webp', '/img/b.webp', '/img/c.webp']

const estado = (cena: number): EstadoCamera => ({
  a: { cena, yaw: 10, pitch: 0, fov: 95 },
  b: null,
  mistura: 0,
})

function montar(aoFalhar = vi.fn()) {
  const ref = createRef<ControlePalco>()
  const r = render(<PalcoPanorama ref={ref} panoramas={panoramas} posteres={posteres} dpr={2} aoFalhar={aoFalhar} />)
  return { ...r, ref, aoFalhar }
}

beforeEach(() => {
  vi.clearAllMocks()
  opcoesRecebidas = undefined
  aoRedimensionar = undefined
  criarMotorMock.mockImplementation((_canvas, _urls, opcoes) => {
    opcoesRecebidas = opcoes
    return motor
  })
  vi.stubGlobal('ResizeObserver', ResizeObserverFalso)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PalcoPanorama', () => {
  it('cria o motor no canvas com os panoramas e o dpr', () => {
    const { container } = montar()
    expect(criarMotorMock).toHaveBeenCalledTimes(1)
    const [canvas, urls, opcoes] = criarMotorMock.mock.calls[0]
    expect(canvas).toBe(container.querySelector('canvas'))
    expect(urls).toEqual(panoramas)
    expect(opcoes.dpr).toBe(2)
  })

  it('ref.definirEstado(e) repassa ao motor', () => {
    const { ref } = montar()
    const e = estado(1)
    ref.current!.definirEstado(e)
    expect(motor.definirEstado).toHaveBeenCalledWith(e)
  })

  it('ref.liberar() solta as texturas do motor sem destruí-lo', () => {
    const { ref } = montar()
    ref.current!.liberar!()
    expect(motor.liberar).toHaveBeenCalledTimes(1)
    expect(motor.destruir).not.toHaveBeenCalled()
  })

  it('mostra o pôster da cena atual', () => {
    const { ref, container } = montar()
    const poster = container.querySelector('img')!
    expect(poster.getAttribute('src')).toBe(posteres[0])
    ref.current!.definirEstado(estado(2))
    expect(poster.getAttribute('src')).toBe(posteres[2])
  })

  it('a falha do motor chega ao aoFalhar mais recente, sem recriar o motor', () => {
    const { aoFalhar, rerender } = montar()
    const novo = vi.fn()
    rerender(<PalcoPanorama ref={createRef()} panoramas={panoramas} posteres={posteres} dpr={2} aoFalhar={novo} />)
    expect(criarMotorMock).toHaveBeenCalledTimes(1)
    opcoesRecebidas!.aoFalhar()
    expect(novo).toHaveBeenCalledTimes(1)
    expect(aoFalhar).not.toHaveBeenCalled()
  })

  it('criarMotor que lança chama aoFalhar e mantém o pôster', () => {
    criarMotorMock.mockImplementation(() => {
      throw new Error('sem WebGL')
    })
    const { aoFalhar, container, ref } = montar()
    expect(aoFalhar).toHaveBeenCalledTimes(1)
    expect(container.querySelector('img')).toBeInTheDocument()
    expect(() => ref.current!.definirEstado(estado(1))).not.toThrow()
  })

  it('canvas aparece só quando a textura da cena chega', () => {
    const { container } = montar()
    const canvas = container.querySelector('canvas')!
    expect(canvas).not.toHaveClass('palco-panorama__canvas--pronto')
    opcoesRecebidas!.aoPronto!(true)
    expect(canvas).toHaveClass('palco-panorama__canvas--pronto')
    opcoesRecebidas!.aoPronto!(false)
    expect(canvas).not.toHaveClass('palco-panorama__canvas--pronto')
  })

  it('redimensiona sem recriar o motor', () => {
    montar()
    motor.redimensionar.mockClear()
    aoRedimensionar!(
      [{ contentRect: { width: 800, height: 600 } } as ResizeObserverEntry],
      {} as ResizeObserver,
    )
    expect(motor.redimensionar).toHaveBeenCalledWith(800, 600)
    expect(criarMotorMock).toHaveBeenCalledTimes(1)
  })

  it('desmontar chama destruir', () => {
    const { unmount } = montar()
    unmount()
    expect(motor.destruir).toHaveBeenCalledTimes(1)
    expect(desconectar).toHaveBeenCalled()
  })
})
