import { useState } from 'react'
import { sondarWebGL } from '../lib/suportaWebGL'
import type { Capacidade } from '../lib/camera/tipos'

export interface SinaisDispositivo {
  webgl: boolean
  maxTextura: number
  memoriaGb?: number
  economiaDados: boolean
  toqueGrosso: boolean
}

/** Decide quanto de 3D o aparelho aguenta, a partir dos sinais já lidos. */
export function escolherCapacidade(s: SinaisDispositivo): Capacidade {
  if (!s.webgl || s.economiaDados || s.maxTextura < 2048) return 'sem3d'
  if (s.maxTextura < 4096) return 'media'
  if (s.memoriaGb !== undefined && s.memoriaGb <= 4) return 'media'
  if (s.toqueGrosso) return 'media'
  return 'alta'
}

function lerSinais(): SinaisDispositivo {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  const { webgl, maxTextura } = sondarWebGL()
  return {
    webgl,
    maxTextura,
    memoriaGb: nav.deviceMemory,
    economiaDados: Boolean(nav.connection?.saveData),
    toqueGrosso: typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches,
  }
}

/** Lê os sinais do aparelho uma vez, na montagem. */
export function useCapacidade3D(): Capacidade {
  const [capacidade] = useState<Capacidade>(() => escolherCapacidade(lerSinais()))
  return capacidade
}
