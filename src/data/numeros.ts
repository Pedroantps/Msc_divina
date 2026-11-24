import type { Area } from './tipos'

export interface ItemNumero {
  valor: number
  legenda: string
}

/** Maior número de um deck, que pode ser 7, '6–7' ou '5 e 16'. Texto sem número vale 0. */
function maiorNumeroDoDeck(deck: number | string | undefined): number {
  if (deck === undefined) return 0
  if (typeof deck === 'number') return Number.isFinite(deck) ? deck : 0
  const numeros = deck.match(/\d+/g)?.map(Number) ?? []
  return numeros.length ? Math.max(...numeros) : 0
}

/** Os 4 números da fileira de Búzios, calculados a partir dos dados do site. */
export function calcularNumeros(areas: Area[], lugares: Area[]): ItemNumero[] {
  const totalCenas = areas.reduce((soma, a) => soma + (a.cenas?.length ?? 0), 0)
  const maiorDeck = areas.reduce((maior, a) => {
    const dosDecks = [a.deck, ...(a.cenas ?? []).map((c) => c.deck)].map(maiorNumeroDoDeck)
    return Math.max(maior, ...dosDecks)
  }, 0)
  return [
    { valor: areas.length, legenda: 'áreas do navio' },
    { valor: totalCenas, legenda: 'ambientes em 360°' },
    { valor: maiorDeck, legenda: 'é o deck mais alto' },
    { valor: lugares.length, legenda: 'lugares em Búzios' },
  ]
}
