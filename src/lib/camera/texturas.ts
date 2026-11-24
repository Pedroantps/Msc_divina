/** Carrega um recurso (ex.: textura de panorama) e respeita o cancelamento pelo `sinal`. */
export type Carregador<T> = (url: string, sinal: AbortSignal) => Promise<T>

interface Entrada<T> {
  controle: AbortController
  valor?: T
}

/**
 * Janela deslizante de texturas: mantém só a cena focada e as vizinhas (anterior e próxima),
 * no máximo 3 vivas. O que sai da janela é abortado (se carregando) ou descartado (se pronto).
 * Um salto longo (âncora, barra de rolagem) vai direto à janela nova, sem passar pelas do meio.
 */
export class GerenteTexturas<T> {
  private readonly entradas = new Map<number, Entrada<T>>()
  private readonly ouvintes = new Set<() => void>()
  private destruido = false
  private readonly urls: string[]
  private readonly carregar: Carregador<T>
  private readonly descartar: (t: T) => void

  constructor(urls: string[], carregar: Carregador<T>, descartar: (t: T) => void) {
    this.urls = urls
    this.carregar = carregar
    this.descartar = descartar
  }

  /** Mantém `indice - 1`, `indice` e `indice + 1`; aborta ou descarta o resto. */
  focar(indice: number): void {
    if (this.destruido) return
    // Ordem de pedido: a cena focada primeiro, depois a próxima (rolagem para baixo) e a anterior.
    const janela = [indice, indice + 1, indice - 1].filter((i) => i >= 0 && i < this.urls.length)
    for (const [i, entrada] of this.entradas) {
      if (!janela.includes(i)) this.soltar(i, entrada)
    }
    for (const i of janela) {
      if (!this.entradas.has(i)) this.pedir(i)
    }
  }

  /** A textura pronta, ou `undefined` enquanto carrega, após erro ou fora da janela. */
  obter(indice: number): T | undefined {
    return this.entradas.get(indice)?.valor
  }

  /** Avisa quando uma textura chega ou falha. Devolve a função que cancela o aviso. */
  aoMudar(fn: () => void): () => void {
    this.ouvintes.add(fn)
    return () => {
      this.ouvintes.delete(fn)
    }
  }

  destruir(): void {
    this.destruido = true
    for (const [i, entrada] of this.entradas) this.soltar(i, entrada)
    this.ouvintes.clear()
  }

  private pedir(i: number): void {
    const entrada: Entrada<T> = { controle: new AbortController() }
    this.entradas.set(i, entrada)
    let promessa: Promise<T>
    try {
      promessa = this.carregar(this.urls[i], entrada.controle.signal)
    } catch (erro) {
      promessa = Promise.reject(erro)
    }
    promessa.then(
      (valor) => {
        // Chegou depois de sair da janela (ou de destruir): não fica viva.
        if (entrada.controle.signal.aborted || this.entradas.get(i) !== entrada) {
          this.descartar(valor)
          return
        }
        entrada.valor = valor
        this.avisar()
      },
      () => {
        // Erro (404, rede, abortado): a entrada fica sem valor e a vista segue no pôster.
        // Ela sai da janela normalmente; ao voltar a ela, o pedido é refeito.
        if (!entrada.controle.signal.aborted && this.entradas.get(i) === entrada) this.avisar()
      },
    )
  }

  private soltar(i: number, entrada: Entrada<T>): void {
    this.entradas.delete(i)
    entrada.controle.abort()
    if (entrada.valor !== undefined) this.descartar(entrada.valor)
  }

  private avisar(): void {
    for (const fn of [...this.ouvintes]) {
      try {
        fn()
      } catch (erro) {
        console.error(erro)
      }
    }
  }
}
