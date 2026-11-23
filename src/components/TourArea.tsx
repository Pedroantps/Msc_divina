import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import type { Area, Cena } from '../data/tipos'
import { CtaAcento } from './CtaAcento'
import { ImagemComFallback } from './ImagemComFallback'
import { Panorama360 } from './Panorama360'
import './TourArea.css'

export const URL_TOUR_OFICIAL = 'https://virtual-tours.msccruises.com/MSC-Divina/en-gb/index.html'

interface TourAreaProps {
  area: Area
  aberto: boolean
  aoFechar: () => void
  /** id da cena em que o tour abre (padrão: a primeira). */
  cenaInicial?: string
  /** Elemento que recebe o foco ao fechar (o CTA que abriu). Sem ele, volta ao que tinha o foco. */
  retornoFoco?: RefObject<HTMLElement | null>
}

/** As cenas da área; uma área só com `panorama` vira uma cena única. */
function cenasDaArea(area: Area): Cena[] {
  if (area.cenas && area.cenas.length > 0) return area.cenas
  if (area.panorama) {
    return [{ id: area.id, nome: area.nome, deck: area.deck, panorama: area.panorama, yaw: area.yaw ?? 0 }]
  }
  return []
}

const miniaturaDe = (cena: Cena) => `/miniatura/${cena.id}.webp`

/** Tour 360° da área em tela cheia, no estilo do tour virtual da MSC. */
export function TourArea({ area, aberto, aoFechar, cenaInicial, retornoFoco }: TourAreaProps) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const origem = useRef<Element | null>(null)

  // Abre e fecha o <dialog> nativo (foco preso e fundo inerte vêm dele).
  useLayoutEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (aberto && !d.open) {
      origem.current = document.activeElement
      d.showModal()
    } else if (!aberto && d.open) {
      d.close()
    }
  }, [aberto])

  // Devolve o foco a quem abriu.
  const estavaAberto = useRef(false)
  useEffect(() => {
    if (!aberto && estavaAberto.current) {
      const alvo = retornoFoco?.current ?? origem.current
      if (alvo instanceof HTMLElement) alvo.focus()
    }
    estavaAberto.current = aberto
  }, [aberto, retornoFoco])

  // Bloqueia a rolagem do fundo, compensando a barra de rolagem que some.
  useEffect(() => {
    if (!aberto) return
    const { overflow, paddingRight } = document.body.style
    const barra = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (barra > 0) document.body.style.paddingRight = `${barra}px`
    return () => {
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
    }
  }, [aberto])

  return (
    <dialog
      ref={dialogo}
      className="tour"
      aria-label={`Tour em 360°: ${area.nome}`}
      onCancel={(e) => {
        e.preventDefault()
        aoFechar()
      }}
    >
      {aberto && <ConteudoDoTour key={area.id} area={area} cenaInicial={cenaInicial} aoFechar={aoFechar} />}
    </dialog>
  )
}

interface ConteudoProps {
  area: Area
  cenaInicial?: string
  aoFechar: () => void
}

function ConteudoDoTour({ area, cenaInicial, aoFechar }: ConteudoProps) {
  const cenas = cenasDaArea(area)
  const [indice, setIndice] = useState(() => Math.max(0, cenas.findIndex((c) => c.id === cenaInicial)))
  const cena = cenas[indice] as Cena | undefined
  const varias = cenas.length > 1
  const faixa = useRef<HTMLUListElement>(null)

  const mover = useCallback(
    (passo: number) => {
      if (cenas.length > 1) setIndice((i) => (i + passo + cenas.length) % cenas.length)
    },
    [cenas.length],
  )

  // Teclado no documento: depois de clicar no panorama o foco pode estar fora do diálogo.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        aoFechar()
      } else if (e.key === 'ArrowLeft') mover(-1)
      else if (e.key === 'ArrowRight') mover(1)
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aoFechar, mover])

  // Mantém a miniatura ativa à vista na faixa.
  useEffect(() => {
    const ativa = faixa.current?.querySelector<HTMLElement>('[aria-current="true"]')
    ativa?.scrollIntoView?.({ inline: 'center', block: 'nearest' })
  }, [indice])

  const deck = cena?.deck ?? area.deck
  const nomeDaCena = cena?.nome ?? area.nome
  const mostrarArea = nomeDaCena !== area.nome

  return (
    <div className="tour__conteudo">
      <div className="tour__palco">
        {cena ? (
          <Panorama360
            ativo
            rolagemZoom
            giroscopio
            panorama={cena.panorama}
            yaw={cena.yaw}
            imagemPlana={indice === 0 ? area.imagem : miniaturaDe(cena)}
            alt={cena.nome}
          />
        ) : (
          <ImagemComFallback className="tour__foto" src={area.imagem} alt={area.nome} />
        )}
      </div>

      <header className="tour__topo">
        <div className="tour__info">
          {mostrarArea && <p className="tour__area rotulo">{area.nome}</p>}
          <h2 className="tour__cena">{nomeDaCena}</h2>
          {deck !== undefined && <p className="tour__deck rotulo">Deck {deck}</p>}
        </div>
        <button type="button" className="tour__fechar" onClick={aoFechar} aria-label="Fechar">
          <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
            <path d="M4.3 4.3l11.4 11.4M15.7 4.3L4.3 15.7" stroke="currentColor" strokeWidth="1.8" fill="none" />
          </svg>
        </button>
      </header>

      {varias && (
        <>
          <button type="button" className="tour__seta tour__seta--anterior" onClick={() => mover(-1)} aria-label="Cena anterior">
            <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
              <path d="M12.5 3.5 6 10l6.5 6.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
            </svg>
          </button>
          <button type="button" className="tour__seta tour__seta--proxima" onClick={() => mover(1)} aria-label="Próxima cena">
            <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
              <path d="M7.5 3.5 14 10l-6.5 6.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
            </svg>
          </button>
        </>
      )}

      <footer className="tour__rodape">
        <CtaAcento className="tour__oficial" rotulo="Tour oficial da MSC" icone="seta-externa" href={URL_TOUR_OFICIAL} externo />
        {varias && (
          <ul ref={faixa} className="tour__cenas" aria-label="Ambientes desta área">
            {cenas.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="tour__miniatura"
                  aria-current={i === indice ? 'true' : undefined}
                  onClick={() => setIndice(i)}
                >
                  <img src={miniaturaDe(c)} alt="" width="160" height="90" loading="lazy" decoding="async" />
                  <span className="tour__nome-cena">{c.nome}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </footer>
    </div>
  )
}
