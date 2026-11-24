import { useCallback, useMemo, useRef, type FocusEvent } from 'react'
import type { Area } from '../data/tipos'
import { useFavoritos } from '../hooks/useFavoritos'
import { srcSetDe } from '../lib/imagens'
import { gsap, useGSAP } from '../lib/gsap'
import { rolarPara } from '../lib/rolagem'
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
  if (a.categoria === 'buzios') return 'Búzios'
  if (a.deck !== undefined) return `Deck ${a.deck}`
  const n = a.cenas?.length ?? 0
  if (n === 0) return ''
  return n === 1 ? '1 ambiente em 360°' : `${n} ambientes em 360°`
}

// Parallax só em tela larga; no celular é uma coluna sem movimento.
const CONSULTA_PARALLAX = '(min-width: 48rem) and (prefers-reduced-motion: no-preference)'

export function SelecaoFavoritos({ areas }: SelecaoFavoritosProps) {
  const secaoRef = useRef<HTMLElement>(null)
  const ids = useMemo(() => areas.map((a) => a.id), [areas])
  const { selecionados, alternar, limpar } = useFavoritos(ids)

  useGSAP(
    () => {
      if (typeof window.matchMedia !== 'function') return
      // gsap.matchMedia reavalia ao girar o aparelho ou mudar a preferência de movimento.
      const mm = gsap.matchMedia(secaoRef.current ?? undefined)
      mm.add(CONSULTA_PARALLAX, () => {
        const gatilho = {
          trigger: secaoRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        }
        gsap.fromTo('.favoritos__marca', { xPercent: 3 }, { xPercent: -3, ease: 'none', scrollTrigger: gatilho })
        gsap.fromTo('.favoritos__coluna--a', { yPercent: 2 }, { yPercent: -4, ease: 'none', scrollTrigger: gatilho })
        gsap.fromTo('.favoritos__coluna--b', { yPercent: 4 }, { yPercent: -10, ease: 'none', scrollTrigger: gatilho })
      })
      return () => mm.revert()
    },
    { scope: secaoRef, dependencies: [areas.length], revertOnUpdate: true },
  )

  // O parallax desloca os cartões: quem navega por teclado precisa ver o foco.
  const aoFocar = useCallback(
    (e: FocusEvent<HTMLElement>) => {
      const alvo = e.target
      if (!alvo.closest('.favoritos__colunas') || typeof alvo.scrollIntoView !== 'function') return
      let teclado = true
      try {
        teclado = alvo.matches(':focus-visible')
      } catch {
        // seletor não suportado: trata como teclado
      }
      if (!teclado) return
      requestAnimationFrame(() => {
        rolarPara(alvo, { bloco: 'center' })
      })
    },
    [],
  )

  const cartao = (a: Area, indice: number) => {
    const marcado = selecionados.includes(a.id)
    return (
      <li key={a.id} className="favoritos__cartao" style={{ order: indice }}>
        <div className="favoritos__foto">
          <ImagemComFallback
            src={a.imagem}
            srcSet={srcSetDe(a.imagem)}
            sizes="(min-width: 48rem) 28rem, 100vw"
            alt=""
          />
        </div>
        <div className="favoritos__barra">
          <CtaAcento
            soQuadrado
            icone={marcado ? 'check' : 'mais'}
            pressionado={marcado}
            rotulo={`Favoritar ${a.nome}`}
            onClick={() => alternar(a.id)}
          />
          <div className="favoritos__texto">
            <h3 className="favoritos__nome">{a.nome}</h3>
            {legenda(a) && <p className="favoritos__legenda rotulo">{legenda(a)}</p>}
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
      onFocus={aoFocar}
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
      <div className={`favoritos__resumo${selecionados.length === 0 ? ' favoritos__resumo--vazio' : ''}`}>
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
