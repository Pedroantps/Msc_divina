import type { Area } from './tipos'

const credito = 'Foto: Família'

export const lugaresBuzios: Area[] = [
  { id: 'rua-das-pedras', nome: 'Rua das Pedras', categoria: 'buzios',
    descricao: 'Rua central de Búzios, com restaurantes, bares e lojas.',
    imagem: '/img/rua-das-pedras.webp', credito },
  { id: 'orla-bardot', nome: 'Orla Bardot', categoria: 'buzios',
    descricao: 'Passeio à beira-mar, bom para caminhar no fim da tarde.',
    imagem: '/img/orla-bardot.webp', credito },
  { id: 'praia-de-geriba', nome: 'Praia de Geribá', categoria: 'buzios',
    descricao: 'Praia longa de Búzios, com quiosques e bastante movimento.',
    imagem: '/img/praia-de-geriba.webp', credito },
  { id: 'praia-joao-fernandes', nome: 'Praia João Fernandes', categoria: 'buzios',
    descricao: 'Praia de águas calmas e muito procurada em Búzios.',
    imagem: '/img/praia-joao-fernandes.webp', credito },
]
