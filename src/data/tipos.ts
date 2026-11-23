export type Categoria = 'navio' | 'buzios'

/** Um ponto de 360° dentro de uma área (como as cenas do tour virtual da MSC). */
export interface Cena {
  id: string
  nome: string
  deck?: number | string
  panorama: string
  /** Para onde a câmera olha ao abrir, em graus (0 = centro da imagem). */
  yaw: number
}

export interface Area {
  id: string
  nome: string
  categoria: Categoria
  deck?: number | string
  descricao: string
  imagem: string
  /** Panorama principal (o da primeira cena, quando há cenas). */
  panorama?: string
  /** Yaw inicial do panorama principal, em graus. */
  yaw?: number
  cenas?: Cena[]
  credito: string
}
