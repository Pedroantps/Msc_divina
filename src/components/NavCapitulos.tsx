import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useProgressoCapitulo } from '../hooks/useProgressoCapitulo'
import { useReducedMotion } from '../hooks/useReducedMotion'
import type { Area, Capitulo } from '../data/tipos'
import './NavCapitulos.css'

interface Props {
  capitulos: Capitulo[]
  areas: Area[]
}

interface AbaProps {
  capitulo: Capitulo
  atual: boolean
  aoClicar: () => void
}

function Aba({ capitulo, atual, aoClicar }: AbaProps) {
  const alvo = useRef<HTMLElement | null>(null)
  // Resolve o elemento depois do mount, antes do efeito do hook de progresso.
  useLayoutEffect(() => {
    alvo.current = document.getElementById(capitulo.ancora)
  }, [capitulo.ancora])
  const progresso = useProgressoCapitulo(alvo)

  return (
    <button type="button" className="nav-cap__aba" aria-current={atual ? 'true' : undefined} onClick={aoClicar}>
      <span className="nav-cap__nome">{capitulo.nome}</span>
      <span className="nav-cap__linha" aria-hidden="true" style={{ transform: `scaleX(${progresso})` }} />
    </button>
  )
}

/** Capítulo atual: o último cuja âncora já passou da metade de cima da janela. */
function capituloAtual(capitulos: Capitulo[]): string | undefined {
  let atual = capitulos[0]?.id
  for (const c of capitulos) {
    const el = document.getElementById(c.ancora)
    if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.5) atual = c.id
  }
  return atual
}

/** Barra fixa de capítulos no canto inferior direito, com linha de progresso e índice em diálogo. */
export function NavCapitulos({ capitulos, areas }: Props) {
  const reduzido = useReducedMotion()
  const [atual, setAtual] = useState<string | undefined>(capitulos[0]?.id)
  const botaoIndice = useRef<HTMLButtonElement>(null)
  const dialogo = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const atualizar = () => setAtual(capituloAtual(capitulos))
    atualizar()
    // Agrupa os eventos de rolagem em um único cálculo por quadro.
    let quadro = 0
    const agendar = () => {
      if (quadro) return
      quadro = requestAnimationFrame(() => {
        quadro = 0
        atualizar()
      })
    }
    window.addEventListener('scroll', agendar, { passive: true })
    window.addEventListener('resize', agendar)
    return () => {
      if (quadro) cancelAnimationFrame(quadro)
      window.removeEventListener('scroll', agendar)
      window.removeEventListener('resize', agendar)
    }
  }, [capitulos])

  const irPara = (ancora: string) => {
    document.getElementById(ancora)?.scrollIntoView({ behavior: reduzido ? 'auto' : 'smooth', block: 'start' })
  }

  const abrir = () => {
    const d = dialogo.current
    if (!d) return
    if (typeof d.showModal === 'function') d.showModal()
    else d.setAttribute('open', '')
  }

  const fechar = useCallback(() => {
    const d = dialogo.current
    if (d?.hasAttribute('open')) {
      if (typeof d.close === 'function') d.close()
      else d.removeAttribute('open')
    }
    botaoIndice.current?.focus()
  }, [])

  const porCapitulo = capitulos.map((c) => ({
    capitulo: c,
    // Só o capítulo do navio lista áreas; os demais aparecem como o próprio link.
    areas: c.id === 'navio' ? areas.filter((a) => a.categoria === 'navio') : [],
  }))

  return (
    <>
      <nav className="nav-cap" aria-label="Capítulos">
        {capitulos.map((c) => (
          <Aba key={c.id} capitulo={c} atual={atual === c.id} aoClicar={() => irPara(c.ancora)} />
        ))}
        <button ref={botaoIndice} type="button" className="nav-cap__indice" aria-haspopup="dialog" onClick={abrir}>
          <span aria-hidden="true">☰</span>
          <span className="visualmente-oculto">Índice</span>
        </button>
      </nav>

      <dialog
        ref={dialogo}
        className="nav-cap__dialogo"
        aria-label="Índice do site"
        onClose={() => botaoIndice.current?.focus()}
        onCancel={(e) => {
          e.preventDefault()
          fechar()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            fechar()
          }
        }}
      >
        <div className="nav-cap__cabecalho">
          <span className="rotulo">Índice</span>
          <button type="button" className="nav-cap__fechar rotulo" onClick={fechar}>
            Fechar
          </button>
        </div>
        {porCapitulo.map(({ capitulo, areas: lista }) => (
          <section key={capitulo.id} className="nav-cap__grupo">
            <h2 className="nav-cap__grupo-titulo">
              <a href={`#${capitulo.ancora}`} onClick={fechar}>
                {capitulo.nome}
              </a>
            </h2>
            {lista.length > 0 && (
              <ul className="nav-cap__lista">
                {lista.map((a) => (
                  <li key={a.id}>
                    <a href={`#${a.id}`} onClick={fechar}>
                      <span>{a.nome}</span>
                      {a.deck !== undefined && <span className="nav-cap__deck rotulo">Deck {a.deck}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </dialog>
    </>
  )
}
