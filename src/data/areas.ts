import type { Area } from './tipos'

const credito = 'Foto: Família'

export const areasDoNavio: Area[] = [
  { id: 'teatro-pantheon', nome: 'Teatro Pantheon', categoria: 'navio', deck: 6,
    descricao: 'O teatro do navio, com espetáculos à noite. Descrição provisória.',
    imagem: '/img/teatro-pantheon.webp', panorama: '/pano/teatro-pantheon.webp', credito },
  { id: 'piscina-infinity', nome: 'Piscina Infinity', categoria: 'navio', deck: 14,
    descricao: 'Piscina ao ar livre com vista para o mar. Descrição provisória.',
    imagem: '/img/piscina-infinity.webp', panorama: '/pano/piscina-infinity.webp', credito },
  { id: 'yacht-club', nome: 'Yacht Club', categoria: 'navio', deck: 16,
    descricao: 'Área exclusiva do navio, com serviço diferenciado. Descrição provisória.',
    imagem: '/img/yacht-club.webp', panorama: '/pano/yacht-club.webp', credito },
  { id: 'aurea-spa', nome: 'Aurea Spa', categoria: 'navio', deck: 15,
    descricao: 'Espaço de relaxamento e bem-estar a bordo. Descrição provisória.',
    imagem: '/img/aurea-spa.webp', credito },
  { id: 'cassino', nome: 'Cassino', categoria: 'navio', deck: 7,
    descricao: 'Cassino do navio, aberto em alto-mar. Descrição provisória.',
    imagem: '/img/cassino.webp', credito },
  { id: 'buffet', nome: 'Buffet', categoria: 'navio', deck: 13,
    descricao: 'Restaurante self-service para as refeições do dia. Descrição provisória.',
    imagem: '/img/buffet.webp', credito },
  { id: 'galeria-lojas', nome: 'Galeria e Lojas', categoria: 'navio', deck: 5,
    descricao: 'Passeio central com lojas e bares. Descrição provisória.',
    imagem: '/img/galeria-lojas.webp', credito },
  { id: 'kids-club', nome: 'Kids Club', categoria: 'navio', deck: 12,
    descricao: 'Espaço de atividades para as crianças. Descrição provisória.',
    imagem: '/img/kids-club.webp', credito },
  { id: 'boliche-formula-1', nome: 'Boliche e Fórmula 1', categoria: 'navio', deck: 17,
    descricao: 'Diversão esportiva a bordo, com boliche e simulador. Descrição provisória.',
    imagem: '/img/boliche-formula-1.webp', credito },
]
