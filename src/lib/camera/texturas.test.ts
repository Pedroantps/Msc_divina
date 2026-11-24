import { describe, expect, it, vi } from 'vitest'
import { GerenteTexturas } from './texturas'

interface Pedido {
  url: string
  sinal: AbortSignal
  resolver: (t: string) => void
  rejeitar: (e: unknown) => void
}

/** Carregador falso: cada pedido fica pendente até o teste resolvê-lo. */
function montar(total = 14) {
  const urls = Array.from({ length: total }, (_, i) => `/pano/${i}.webp`)
  const pedidos: Pedido[] = []
  const carregar = vi.fn((url: string, sinal: AbortSignal) =>
    new Promise<string>((resolver, rejeitar) => {
      pedidos.push({ url, sinal, resolver, rejeitar })
    }),
  )
  const descartar = vi.fn()
  const gerente = new GerenteTexturas<string>(urls, carregar, descartar)
  const pedidosDe = () => carregar.mock.calls.map(([url]) => Number(/\/(\d+)\.webp/.exec(url)![1]))
  const pedido = (i: number) => pedidos.find((p) => p.url === urls[i])!
  return { gerente, carregar, descartar, pedidos, pedidosDe, pedido }
}

const esperar = () => new Promise((r) => setTimeout(r, 0))

describe('GerenteTexturas', () => {
  it('focar(5) pede só 4, 5 e 6', () => {
    const { gerente, pedidosDe } = montar()
    gerente.focar(5)
    expect(pedidosDe().sort((x, y) => x - y)).toEqual([4, 5, 6])
  })

  it('pede primeiro a cena focada', () => {
    const { gerente, pedidosDe } = montar()
    gerente.focar(5)
    expect(pedidosDe()[0]).toBe(5)
  })

  it('respeita as bordas da lista', () => {
    const { gerente, pedidosDe } = montar(3)
    gerente.focar(0)
    expect(pedidosDe().sort()).toEqual([0, 1])
    gerente.focar(2)
    expect(pedidosDe().sort()).toEqual([0, 1, 2])
  })

  it('focar(5) depois focar(6) descarta 4 e pede 7', async () => {
    const { gerente, pedido, pedidosDe, descartar } = montar()
    gerente.focar(5)
    pedido(4).resolver('t4')
    pedido(5).resolver('t5')
    pedido(6).resolver('t6')
    await esperar()
    expect(gerente.obter(4)).toBe('t4')

    gerente.focar(6)
    expect(descartar).toHaveBeenCalledTimes(1)
    expect(descartar).toHaveBeenCalledWith('t4')
    expect(gerente.obter(4)).toBeUndefined()
    expect(pedidosDe()).toHaveLength(4)
    expect(pedidosDe()).toContain(7)
    expect(gerente.obter(5)).toBe('t5')
    expect(gerente.obter(6)).toBe('t6')
  })

  it('pula janela sem carregar intermediárias', () => {
    const { gerente, pedido, pedidosDe } = montar()
    gerente.focar(0)
    gerente.focar(10)
    expect(pedido(0).sinal.aborted).toBe(true)
    expect(pedido(1).sinal.aborted).toBe(true)
    const pedidas = pedidosDe()
    for (let i = 2; i <= 8; i++) expect(pedidas).not.toContain(i)
    expect(pedidas.filter((i) => i >= 9).sort((x, y) => x - y)).toEqual([9, 10, 11])
  })

  it('descarta textura que chega depois de sair da janela', async () => {
    const { gerente, pedido, descartar } = montar()
    gerente.focar(0)
    gerente.focar(10)
    pedido(1).resolver('atrasada')
    await esperar()
    expect(descartar).toHaveBeenCalledWith('atrasada')
    expect(gerente.obter(1)).toBeUndefined()
  })

  it('obter é undefined enquanto carrega', () => {
    const { gerente } = montar()
    gerente.focar(3)
    expect(gerente.obter(3)).toBeUndefined()
  })

  it('aoMudar avisa quando uma textura chega e pode ser cancelado', async () => {
    const { gerente, pedido } = montar()
    const fn = vi.fn()
    const parar = gerente.aoMudar(fn)
    gerente.focar(3)
    pedido(3).resolver('t3')
    await esperar()
    expect(fn).toHaveBeenCalledTimes(1)
    parar()
    pedido(4).resolver('t4')
    await esperar()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('textura com erro mantém pôster', async () => {
    const { gerente, pedido } = montar()
    const fn = vi.fn()
    gerente.aoMudar(fn)
    gerente.focar(3)
    pedido(3).rejeitar(new Error('404'))
    pedido(4).resolver('t4')
    await esperar()
    expect(gerente.obter(3)).toBeUndefined()
    expect(gerente.obter(4)).toBe('t4')
    expect(fn).toHaveBeenCalled()
  })

  it('carregador que lança na hora não quebra o foco', () => {
    const urls = ['/a', '/b']
    const gerente = new GerenteTexturas<string>(urls, () => { throw new Error('síncrono') }, vi.fn())
    expect(() => gerente.focar(0)).not.toThrow()
    expect(gerente.obter(0)).toBeUndefined()
  })

  it('destruir() chama descartar para todas as vivas e aborta as pendentes', async () => {
    const { gerente, pedido, descartar } = montar()
    gerente.focar(5)
    pedido(4).resolver('t4')
    pedido(5).resolver('t5')
    await esperar()
    gerente.destruir()
    expect(descartar.mock.calls.map(([t]) => t).sort()).toEqual(['t4', 't5'])
    expect(pedido(6).sinal.aborted).toBe(true)
    pedido(6).resolver('t6')
    await esperar()
    expect(descartar).toHaveBeenCalledWith('t6')
    expect(gerente.obter(5)).toBeUndefined()
  })
})
