import { useMemo, useRef } from 'react'
import type { Area } from '../data/tipos'
import { useFavoritos } from '../hooks/useFavoritos'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { gsap, useGSAP } from '../lib/gsap'
import { CtaAcento } from './CtaAcento'
import { ImagemComFallback } from './ImagemComFallback'
import { RotaSvg } from './RotaSvg'
import './SelecaoFavoritos.css'

interface SelecaoFavoritosProps {
  areas: Area[]
}

function textoContador(n: number) {
  if (n === 0) return 'Nenhum lugar escolhido'
  return n === 1 ? '1 lugar escolhido' : `${n} lugares escolhidos`
}

function legenda(a: Area) {
  return a.categoria === 'buzios' ? 'Búzios' : `Deck ${a.deck}`
}

// Parallax só em tela larga; no celular é uma coluna sem movimento.
const CONSULTA_LARGA = '(min-width: 48rem)'

export function SelecaoFavoritos({ areas }: SelecaoFavoritosProps) {
  const secaoRef = useRef<HTMLElement>(null)
  const reduzido = useReducedMotion()
  const ids = useMemo(() => areas.map((a) => a.id), [areas])
  const { selecionados, alternar, limpar } = useFavoritos(ids)

  useGSAP(
    () => {
      if (reduzido) return
      const larga = typeof window.matchMedia === 'function' && window.matchMedia(CONSULTA_LARGA).matches
      if (!larga) return
      const gatilho = {
        trigger: secaoRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      }
      gsap.fromTo('.favoritos__marca', { xPercent: 8 }, { xPercent: -8, ease: 'none', scrollTrigger: gatilho })
      gsap.fromTo('.favoritos__coluna--a', { yPercent: 2 }, { yPercent: -4, ease: 'none', scrollTrigger: gatilho })
      gsap.fromTo('.favoritos__coluna--b', { yPercent: 4 }, { yPercent: -10, ease: 'none', scrollTrigger: gatilho })
    },
    { scope: secaoRef, dependencies: [reduzido, areas.length], revertOnUpdate: true },
  )

  const cartao = (a: Area, indice: number) => {
    const marcado = selecionados.includes(a.id)
    return (
      <li key={a.id} className="favoritos__cartao" style={{ order: indice }}>
        <div className="favoritos__foto">
          <ImagemComFallback src={a.imagem} alt="" />
        </div>
        <div className="favoritos__barra">
          <CtaAcento
            soQuadrado
            icone={marcado ? 'check' : 'mais'}
            pressionado={marcado}
            rotulo={marcado ? `Remover ${a.nome} dos favoritos` : `Favoritar ${a.nome}`}
            onClick={() => alternar(a.id)}
          />
          <div className="favoritos__texto">
            <h3 className="favoritos__nome">{a.nome}</h3>
            <p className="favoritos__legenda rotulo">{legenda(a)}</p>
          </div>
        </div>
      </li>
    )
  }

  const colunaA = areas.map((a, i) => [a, i] as const).filter(([, i]) => i % 2 === 0)
  const colunaB = areas.map((a, i) => [a, i] as const).filter(([, i]) => i % 2 === 1)

  return (
    <section
      ref={secaoRef}
      id="favoritos"
      className="favoritos"
      data-tema="claro"
      aria-labelledby="favoritos-titulo"
    >
      <p className="favoritos__marca exibicao" aria-hidden="true">
        Favoritos
      </p>
      <RotaSvg />
      <header className="favoritos__cabecalho">
        <h2 id="favoritos-titulo" className="favoritos__titulo">
          Nossos favoritos
        </h2>
        <p className="favoritos__instrucao">Marque o que vocês mais querem aproveitar</p>
      </header>
      <div className="favoritos__colunas">
        <ul className="favoritos__coluna favoritos__coluna--a">{colunaA.map(([a, i]) => cartao(a, i))}</ul>
        <ul className="favoritos__coluna favoritos__coluna--b">{colunaB.map(([a, i]) => cartao(a, i))}</ul>
      </div>
      <div className="favoritos__resumo">
        <p className="favoritos__contador rotulo" aria-live="polite">
          {textoContador(selecionados.length)}
        </p>
        <button type="button" className="favoritos__limpar rotulo" onClick={limpar} disabled={selecionados.length === 0}>
          Limpar seleção
        </button>
      </div>
    </section>
  )
}
