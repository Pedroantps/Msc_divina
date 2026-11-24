import type { Area } from './tipos'
import type { RoteiroArea } from '../lib/camera/tipos'
import { areasDoNavio } from './areas'

/**
 * Roteiro padrão de câmera de uma parada (spec 5.2): chega aberta (100°), gira de yaw-27,5 a yaw+27,5
 * enquanto o texto está na tela (p 0,18 a 0,62), vira para a saída (yaw+50) e avança fechando o FOV até 55°.
 */
export function roteiroPadrao(area: Pick<Area, 'id' | 'yaw'>): RoteiroArea {
  const y = area.yaw ?? 0
  const saidaYaw = y + 50
  return {
    areaId: area.id,
    saidaYaw,
    quadros: [
      { p: 0, yaw: y - 27.5, pitch: -4, fov: 100 },
      { p: 0.15, yaw: y - 27.5, pitch: -4, fov: 92 },
      { p: 0.62, yaw: y + 27.5, pitch: 4, fov: 85 },
      { p: 0.78, yaw: saidaYaw, pitch: 0, fov: 85 },
      { p: 1, yaw: saidaYaw, pitch: 0, fov: 55 },
    ],
  }
}

/** Um roteiro por área do navio, na ordem do Percurso. Sobrescritas por área entram aqui. */
export const roteiros: RoteiroArea[] = areasDoNavio.map(roteiroPadrao)
