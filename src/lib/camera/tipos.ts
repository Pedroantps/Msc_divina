/** Contratos compartilhados da câmera 360° do Percurso (Fase 3). */

/** O que a câmera mostra: qual cena (índice em areasDoNavio) e para onde olha, em graus. */
export interface Vista {
  cena: number
  yaw: number
  pitch: number
  fov: number
}

/** Estado completo do palco: a vista atual, a próxima (durante o avanço) e a mistura entre elas. */
export interface EstadoCamera {
  a: Vista
  b: Vista | null
  /** 0 = só `a`, 1 = só `b`. */
  mistura: number
}

/** Quadro-chave de câmera dentro de uma parada; `p` vai de 0 a 1. */
export interface QuadroChave {
  p: number
  yaw: number
  pitch: number
  fov: number
}

export interface RoteiroArea {
  areaId: string
  quadros: QuadroChave[]
  /** Direção para onde a câmera "anda" ao sair da área. */
  saidaYaw: number
}

export type Capacidade = 'alta' | 'media' | 'sem3d'

/** Interface imperativa dos palcos (WebGL ou fotos): recebe o estado a cada atualização da rolagem. */
export interface ControlePalco {
  definirEstado(e: EstadoCamera): void
}

/** Altura de cada parada, em telas (200svh). */
export const ALTURA_PARADA = 2
/** Início do avanço para a próxima área, em progresso da parada. */
export const P_AVANCO = 0.85
/** Menor campo de visão permitido (só durante o avanço). */
export const FOV_MIN = 55
/** Menor campo de visão nas fases de leitura. */
export const FOV_LEITURA = 85
/** Giro máximo de yaw por tela rolada, em graus. */
export const GIRO_MAX_POR_TELA = 90
