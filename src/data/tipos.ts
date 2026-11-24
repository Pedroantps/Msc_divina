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
  /** Frase curta da parada no Percurso (ex.: "Onde a noite começa"). Só áreas do navio. */
  titulo?: string
  descricao: string
  imagem: string
  /** Panorama principal (o da primeira cena, quando há cenas). */
  panorama?: string
  /** Yaw inicial do panorama principal, em graus. */
  yaw?: number
  cenas?: Cena[]
  credito: string
}

/** Capítulo do site, mostrado na barra fixa (ex.: "O navio", "Búzios"). */
export interface Capitulo {
  id: string
  nome: string
  /** id do elemento onde o capítulo começa. */
  ancora: string
  tema: 'claro' | 'escuro'
}
