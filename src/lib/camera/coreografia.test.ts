import { describe, expect, it } from 'vitest'
import { roteiros } from '../../data/roteiro'
import { ALTURA_PARADA, FOV_MIN, GIRO_MAX_POR_TELA, P_AVANCO } from './tipos'
import { estadoNaRolagem } from './coreografia'

const r = roteiros
const N = r.length
const q = (i: number, p: number) => r[i].quadros.find((x) => x.p === p)!

describe('estadoNaRolagem', () => {
  it('no início mostra o quadro p=0 da primeira área, sem vista b', () => {
    const e = estadoNaRolagem(0, r)
    expect(e.a).toEqual({ cena: 0, yaw: q(0, 0).yaw, pitch: q(0, 0).pitch, fov: q(0, 0).fov })
    expect(e.b).toBeNull()
    expect(e.mistura).toBe(0)
  })

  it('interpola entre os quadros 0,15 e 0,7', () => {
    const e = estadoNaRolagem(2 + (0.15 + 0.7) / 2, r)
    const a = q(2, 0.15)
    const b = q(2, 0.7)
    expect(e.a.cena).toBe(2)
    expect(e.a.yaw).toBeCloseTo((a.yaw + b.yaw) / 2, 5)
    expect(e.a.fov).toBeGreaterThan(b.fov)
    expect(e.a.fov).toBeLessThan(a.fov)
  })

  it('no avanço, b é a vista p=0 da próxima área e a mistura sobe de 0 a 1', () => {
    const ini = estadoNaRolagem(2 + P_AVANCO, r)
    expect(ini.mistura).toBeCloseTo(0, 5)
    expect(ini.b).toEqual({ cena: 3, yaw: q(3, 0).yaw, pitch: q(3, 0).pitch, fov: q(3, 0).fov })
    const meio = estadoNaRolagem(2 + (P_AVANCO + 1) / 2, r)
    expect(meio.mistura).toBeCloseTo(0.5, 5)
    const fim = estadoNaRolagem(3 - 1e-9, r)
    expect(fim.mistura).toBeCloseTo(1, 3)
  })

  it('é contínuo na troca de parada', () => {
    for (let i = 1; i < N; i++) {
      const antes = estadoNaRolagem(i - 1e-6, r)
      const depois = estadoNaRolagem(i, r)
      expect(antes.b).not.toBeNull()
      expect(Math.abs(antes.b!.yaw - depois.a.yaw)).toBeLessThan(0.5)
      expect(Math.abs(antes.b!.pitch - depois.a.pitch)).toBeLessThan(0.5)
      expect(Math.abs(antes.b!.fov - depois.a.fov)).toBeLessThan(0.5)
      expect(antes.b!.cena).toBe(depois.a.cena)
    }
  })

  it('na última área não há b e o fov fica em 85', () => {
    const e = estadoNaRolagem(N - 1 + 0.95, r)
    expect(e.b).toBeNull()
    expect(e.mistura).toBe(0)
    expect(e.a.fov).toBe(85)
    expect(estadoNaRolagem(N, r).a.fov).toBe(85)
  })

  it('limita progresso fora de [0, N]', () => {
    expect(estadoNaRolagem(-3, r)).toEqual(estadoNaRolagem(0, r))
    expect(estadoNaRolagem(N + 5, r)).toEqual(estadoNaRolagem(N, r))
  })

  it('nenhum trecho passa de 90 graus por tela', () => {
    for (const area of r) {
      for (let k = 1; k < area.quadros.length; k++) {
        const a = area.quadros[k - 1]
        const b = area.quadros[k]
        const telas = (b.p - a.p) * ALTURA_PARADA
        expect(Math.abs(b.yaw - a.yaw) / telas, `${area.areaId} ${a.p}-${b.p}`).toBeLessThanOrEqual(GIRO_MAX_POR_TELA)
      }
    }
  })

  it('a velocidade real de giro, amostrada, também respeita o limite', () => {
    const passo = 0.001
    for (let g = 0; g < N - passo; g += passo) {
      if (Math.floor(g) !== Math.floor(g + passo)) continue
      const d = Math.abs(estadoNaRolagem(g + passo, r).a.yaw - estadoNaRolagem(g, r).a.yaw)
      expect(d / (passo * ALTURA_PARADA)).toBeLessThanOrEqual(GIRO_MAX_POR_TELA + 1e-6)
    }
  })

  it('fov nunca fica abaixo de 55 e só fica abaixo de 85 no avanço (p > 0,85)', () => {
    for (let g = 0; g <= N; g += 0.005) {
      const e = estadoNaRolagem(g, r)
      expect(e.a.fov).toBeGreaterThanOrEqual(FOV_MIN)
      const p = g - Math.min(Math.floor(g), N - 1)
      if (e.a.fov < 85 - 1e-9) expect(p).toBeGreaterThan(P_AVANCO)
    }
  })
})
