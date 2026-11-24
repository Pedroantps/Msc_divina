import type { Area } from './tipos'
import type { RoteiroArea } from '../lib/camera/tipos'
import { areasDoNavio } from './areas'

/**
 * Roteiro padrão de câmera de uma parada (spec 5.2): chega aberta (110°), gira de yaw-35 a yaw+35
 * enquanto o texto está na tela, vira para a saída (yaw+60) e avança fechando o FOV até 55°.
 */
export function roteiroPadrao(area: Pick<Area, 'id' | 'yaw'>): RoteiroArea {
  const y = area.yaw ?? 0
  const saidaYaw = y + 60
  return {
    areaId: area.id,
    saidaYaw,
    quadros: [
      { p: 0, yaw: y - 35, pitch: -4, fov: 110 },
      { p: 0.15, yaw: y - 35, pitch: -4, fov: 95 },
      { p: 0.7, yaw: y + 35, pitch: 4, fov: 85 },
      { p: 0.85, yaw: saidaYaw, pitch: 0, fov: 85 },
      { p: 1, yaw: saidaYaw, pitch: 0, fov: 55 },
    ],
  }
}

/** Um roteiro por área do navio, na ordem do Percurso. Sobrescritas por área entram aqui. */
export const roteiros: RoteiroArea[] = areasDoNavio.map(roteiroPadrao)
