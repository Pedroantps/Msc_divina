import type { Area } from './tipos'

/** Lugar de Búzios: uma Area com a frase curta que abre o bloco no capítulo. */
export type LugarBuzios = Area & { frase: string }

export const lugaresBuzios: LugarBuzios[] = [
  { id: 'rua-das-pedras', nome: 'Rua das Pedras', categoria: 'buzios',
    frase: 'O centro de Búzios à noite',
    descricao: 'Rua central de Búzios, com restaurantes, bares e lojas.',
    imagem: '/img/rua-das-pedras.webp', credito: 'Foto: Fulviusbsas, Wikimedia Commons (CC BY-SA 3.0)' },
  { id: 'orla-bardot', nome: 'Orla Bardot', categoria: 'buzios',
    frase: 'Uma caminhada à beira-mar',
    descricao: 'Passeio à beira-mar, bom para caminhar no fim da tarde.',
    imagem: '/img/orla-bardot.webp', credito: 'Foto: Fulviusbsas, Wikimedia Commons (CC BY-SA 3.0)' },
  { id: 'praia-de-geriba', nome: 'Praia de Geribá', categoria: 'buzios',
    frase: 'A praia mais longa e movimentada',
    descricao: 'Praia longa de Búzios, com quiosques e bastante movimento.',
    imagem: '/img/praia-de-geriba.webp', credito: 'Foto: Patrick Montenegro, Wikimedia Commons (CC0)' },
  { id: 'praia-joao-fernandes', nome: 'Praia João Fernandes', categoria: 'buzios',
    frase: 'Águas calmas para um mergulho',
    descricao: 'Praia de águas calmas e muito procurada em Búzios.',
    imagem: '/img/praia-joao-fernandes.webp', credito: 'Foto: Fulviusbsas, Wikimedia Commons (CC BY-SA 3.0)' },
]
