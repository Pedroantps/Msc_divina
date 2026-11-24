/** Faixa de progresso da parada em que o texto fica na tela. */
const TEXTO_DE = 0.18
const TEXTO_ATE = 0.62

/** Parada cujo texto deve aparecer no progresso global, ou null entre textos. */
export function paradaAtiva(progresso: number, total: number): number | null {
  const i = Math.min(Math.floor(progresso), total - 1)
  const p = progresso - i
  return p >= TEXTO_DE && p < TEXTO_ATE ? i : null
}

/**
 * Posição de rolagem do foco na parada `indice`. O ScrollTrigger vai de "top top" a "bottom bottom",
 * então mede (2N-1) telas, não 2N: o alvo sai da janela real (start a end), não da geometria do DOM.
 */
export function alvoDaParada(inicio: number, fim: number, indice: number, total: number): number {
  return inicio + ((indice + 0.4) / total) * (fim - inicio)
}
