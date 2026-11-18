import type { Area } from './tipos'

const credito = 'Foto: Família'

export const areasDoNavio: Area[] = [
  { id: 'teatro-pantheon', nome: 'Teatro Pantheon', categoria: 'navio', deck: 6,
    descricao: 'O teatro do navio, onde acontecem os espetáculos da noite.',
    imagem: '/img/teatro-pantheon.webp', panorama: '/pano/teatro-pantheon.webp', credito },
  { id: 'piscina-infinity', nome: 'Piscina Infinity', categoria: 'navio', deck: 14,
    descricao: 'Piscina ao ar livre, com vista para o mar e espreguiçadeiras ao redor.',
    imagem: '/img/piscina-infinity.webp', panorama: '/pano/piscina-infinity.webp', credito },
  { id: 'yacht-club', nome: 'Yacht Club', categoria: 'navio', deck: 16,
    descricao: 'Área exclusiva do navio, com acesso restrito e serviço diferenciado.',
    imagem: '/img/yacht-club.webp', panorama: '/pano/yacht-club.webp', credito },
  { id: 'aurea-spa', nome: 'Aurea Spa', categoria: 'navio', deck: 15,
    descricao: 'Espaço de relaxamento e bem-estar, com massagens e tratamentos.',
    imagem: '/img/aurea-spa.webp', credito },
  { id: 'cassino', nome: 'Cassino', categoria: 'navio', deck: 7,
    descricao: 'Cassino do navio, com mesas e máquinas, aberto quando o navio está em alto-mar.',
    imagem: '/img/cassino.webp', credito },
  { id: 'buffet', nome: 'Buffet', categoria: 'navio', deck: 13,
    descricao: 'Restaurante self-service, onde fazemos as refeições do dia.',
    imagem: '/img/buffet.webp', credito },
  { id: 'galeria-lojas', nome: 'Galeria e Lojas', categoria: 'navio', deck: 5,
    descricao: 'Passeio central do navio, com lojas e bares.',
    imagem: '/img/galeria-lojas.webp', credito },
  { id: 'kids-club', nome: 'Kids Club', categoria: 'navio', deck: 12,
    descricao: 'Espaço de brincadeiras e atividades para as crianças.',
    imagem: '/img/kids-club.webp', credito },
  { id: 'boliche-formula-1', nome: 'Boliche e Fórmula 1', categoria: 'navio', deck: 17,
    descricao: 'Diversão a bordo, com boliche e simulador de Fórmula 1.',
    imagem: '/img/boliche-formula-1.webp', credito },
]
