import type { EstadoCamera, QuadroChave, RoteiroArea, Vista } from './tipos'
import { P_AVANCO } from './tipos'

const suave = (t: number) => t * t * (3 - 2 * t)

/**
 * Vista de uma área no progresso local `p` (0 a 1). O yaw é linear entre quadros (a velocidade de
 * giro nunca passa da definida pelos quadros); pitch e fov usam easing suave.
 */
function vistaNaParada(cena: number, quadros: QuadroChave[], p: number): Vista {
  const primeiro = quadros[0]
  const ultimo = quadros[quadros.length - 1]
  if (p <= primeiro.p) return { cena, yaw: primeiro.yaw, pitch: primeiro.pitch, fov: primeiro.fov }
  if (p >= ultimo.p) return { cena, yaw: ultimo.yaw, pitch: ultimo.pitch, fov: ultimo.fov }
  let k = 1
  while (quadros[k].p < p) k++
  const a = quadros[k - 1]
  const b = quadros[k]
  const t = (p - a.p) / (b.p - a.p)
  const s = suave(t)
  return {
    cena,
    yaw: a.yaw + (b.yaw - a.yaw) * t,
    pitch: a.pitch + (b.pitch - a.pitch) * s,
    fov: a.fov + (b.fov - a.fov) * s,
  }
}

/**
 * Estado da câmera para o progresso global (índice da parada + progresso local; 0 a roteiros.length).
 * No avanço (p >= P_AVANCO) a vista `b` é o início da próxima parada e a mistura sobe de 0 a 1.
 * Na última parada não há próxima: `b` é null e o FOV fica no valor de leitura.
 */
export function estadoNaRolagem(progresso: number, roteiros: RoteiroArea[]): EstadoCamera {
  const n = roteiros.length
  const g = Math.min(Math.max(Number.isFinite(progresso) ? progresso : 0, 0), n)
  const i = Math.min(Math.floor(g), n - 1)
  const p = g - i
  const ehUltima = i === n - 1

  if (ehUltima && p >= P_AVANCO) {
    return { a: vistaNaParada(i, roteiros[i].quadros, P_AVANCO), b: null, mistura: 0 }
  }

  const a = vistaNaParada(i, roteiros[i].quadros, p)
  if (ehUltima || p < P_AVANCO) return { a, b: null, mistura: 0 }

  const b = vistaNaParada(i + 1, roteiros[i + 1].quadros, 0)
  return { a, b, mistura: (p - P_AVANCO) / (1 - P_AVANCO) }
}
