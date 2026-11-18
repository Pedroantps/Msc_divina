export type Categoria = 'navio' | 'buzios'

export interface Area {
  id: string
  nome: string
  categoria: Categoria
  deck?: number
  descricao: string
  imagem: string
  panorama?: string
  credito: string
}
