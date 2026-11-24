import type { Area, Cena } from './tipos'

// Fotos e panoramas vêm do tour virtual 360° oficial da MSC (virtual-tours.msccruises.com/MSC-Divina).
// Os decks são os do menu desse tour.
const credito = 'Imagem: MSC Cruzeiros, tour virtual 360° do MSC Divina'

const cena = (pasta: string, nome: string, deck: number | string | undefined, yaw: number): Cena => ({
  id: pasta.replace(/_/g, '-'),
  nome,
  deck,
  panorama: `/pano/${pasta.replace(/_/g, '-')}.webp`,
  yaw,
})

type AreaSemPanorama = Omit<Area, 'panorama' | 'yaw' | 'cenas' | 'categoria' | 'imagem' | 'faixa' | 'credito'> & { titulo: string }

const area = (dados: AreaSemPanorama, cenas: Cena[]): Area => ({
  ...dados,
  categoria: 'navio',
  imagem: `/img/${dados.id}.webp`,
  faixa: `/faixa/${dados.id}.webp`,
  panorama: cenas[0].panorama,
  yaw: cenas[0].yaw,
  cenas,
  credito,
})

export const areasDoNavio: Area[] = [
  area({ id: 'recepcao', titulo: 'Bem-vindos a bordo', nome: 'Recepção', deck: 5,
    descricao: 'O saguão de entrada do navio, com o piano e a escadaria de cristal.' },
  [cena('reception', 'Recepção', 5, 0)]),

  area({ id: 'teatro-pantheon', titulo: 'Onde a noite começa', nome: 'Teatro Pantheon', deck: '6–7',
    descricao: 'O teatro do navio, onde acontecem os espetáculos da noite.' },
  [cena('pantheon_theatre', 'Teatro Pantheon', '6–7', 0)]),

  area({ id: 'galeria-lojas', titulo: 'Um passeio no meio do navio', nome: 'Galeria e Lojas', deck: 6,
    descricao: 'Passeio central do navio, com lojas de roupas, joias e doces.' },
  [
    cena('boutique', 'La Boutique', 6, 36.9),
    cena('il_gioiello', 'Il Gioiello', 6, 50.9),
    cena('la_caramella', 'La Caramella', 6, 41.5),
    cena('angolo_oggetto', "L'angolo dell'oggetto", 6, 3.9),
  ]),

  area({ id: 'cassino', titulo: 'Sorte em alto-mar', nome: 'Cassino Veneziano', deck: 7,
    descricao: 'Cassino do navio, com mesas e máquinas, aberto quando o navio está em alto-mar.' },
  [cena('casino', 'Cassino Veneziano', 7, -5.4)]),

  area({ id: 'bares', titulo: 'Música até tarde', nome: 'Bares e Lounges', deck: 7,
    descricao: 'Bares para o fim de tarde e a noite, com música ao vivo e vista para o mar.' },
  [
    cena('golden_jazz_bar', 'Golden Jazz Bar', 7, -113.9),
    cena('black_white', 'Black and White', 7, 4.2),
    cena('la_cantina', 'La Cantina di Bacco', 7, 119),
    cena('cigar_lounge', 'The Cigar Lounge', 6, -25),
    cena('the_garden_bar', 'The Garden Bar', 15, 72.5),
  ]),

  area({ id: 'boliche', titulo: 'Strike no deck 7', nome: 'Boliche e Sports Bar', deck: 7,
    descricao: 'Pistas de boliche e telões com esportes, no Sports and Bowling Diner.' },
  [cena('sports_bar', 'Sports and Bowling Diner', 7, 22.7)]),

  area({ id: 'restaurantes', titulo: 'Jantar com vista', nome: 'Restaurantes', deck: '5 e 16',
    descricao: 'Restaurantes à la carte, do Galaxy no alto do navio ao Black Crab.' },
  [
    cena('galaxy', 'Galaxy Restaurant', 16, 49.6),
    cena('the_black_crab', 'The Black Crab', '5–6', -34.8),
  ]),

  area({ id: 'buffet', titulo: 'Café, almoço e jantar', nome: 'Calumet Buffet', deck: 14,
    descricao: 'Restaurante self-service, onde fazemos as refeições do dia.' },
  [cena('calumet_buffet', 'Calumet Buffet', 14, -68.8)]),

  area({ id: 'piscinas', titulo: 'Sol no deck 14', nome: 'Piscinas', deck: 14,
    descricao: 'Piscinas ao ar livre e sob a cúpula de vidro, com o solário no topo do navio.' },
  [
    cena('piscina', 'Aqua Park', 14, -38.4),
    cena('magrodome', 'Le Sirene (cúpula de vidro)', 14, 75),
    cena('top_18', 'Top 18 Exclusive Solarium', 18, 145.9),
  ]),

  area({ id: 'aurea-spa', titulo: 'Tempo para descansar', nome: 'Aurea Spa', deck: 14,
    descricao: 'Espaço de relaxamento e bem-estar, com massagens, tratamentos e academia.' },
  [
    cena('spa_relax', 'Sala de relaxamento', 14, -100.2),
    cena('spa_massage_room', 'Sala de massagem', 14, -34.2),
    cena('spa_harmony_suite', 'Harmony Suite', 14, -19.4),
    cena('spa_beauty_parlour', 'Salão de beleza', 14, -19.3),
    cena('spa_gym', 'Academia', 14, -154.6),
  ]),

  area({ id: 'kids-club', titulo: 'O lugar das crianças', nome: 'Kids Club', deck: 14,
    descricao: 'Espaço de brincadeiras e atividades para as crianças, com os Smurfs.' },
  [cena('i_puffi', 'I Puffi', 14, -19.6)]),

  area({ id: 'yacht-club', titulo: 'Um navio dentro do navio', nome: 'Yacht Club', deck: 15,
    descricao: 'Área exclusiva do navio, com acesso restrito e serviço diferenciado.' },
  [
    cena('yc_top_sail', 'Top Sail Lounge', 15, -98.5),
    cena('yc_le_muse', 'Le Muse', 15, 76.3),
    cena('yc_the_one_bar', 'The One Bar', 18, 118.1),
    cena('yc_the_one_pool', 'The One Pool', 18, 118.7),
  ]),

  area({ id: 'cinema-4d-f1', titulo: 'Emoção a bordo', nome: 'Cinema 4D e Fórmula 1', deck: 16,
    descricao: 'Cinema 4D e simulador de Fórmula 1, para quem quer emoção a bordo.' },
  [cena('4d_cinema', 'Cinema 4D e simulador F1', 16, 72.6)]),

  area({ id: 'cabines', titulo: 'Nossa casa no mar', nome: 'Cabines',
    descricao: 'Os tipos de cabine do navio, da interna à suíte Aurea.' },
  [
    cena('balcony', 'Cabine com varanda', undefined, -32.9),
    cena('oblo', 'Cabine com vista para o mar', undefined, -2.5),
    cena('inside', 'Cabine interna', undefined, -110.1),
    cena('superfamily', 'Cabine Superfamily', undefined, 62.3),
    cena('suite', 'Suíte Aurea', undefined, 150.7),
  ]),
]
