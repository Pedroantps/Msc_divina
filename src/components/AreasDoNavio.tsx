import { useEffect, useRef, useState, type ReactNode } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'
import type { Area } from '../data/tipos'
import { AreaSection } from './AreaSection'
import { ImagemComFallback } from './ImagemComFallback'
import './AreasDoNavio.css'

interface AreasDoNavioProps {
  areas: Area[]
  renderMidia?: (area: Area) => ReactNode
  /** Marca a instância que vem logo após o Hero e deve sobrepor o fim dele. */
  aposHero?: boolean
}

export function AreasDoNavio({ areas, renderMidia, aposHero }: AreasDoNavioProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const reduzido = useReducedMotion()
  // Sem IntersectionObserver a mídia do palco monta logo; com ele, só perto da tela.
  const [perto, setPerto] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = containerRef.current
    if (reduzido || perto || !el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setPerto(true)
          obs.disconnect()
        }
      },
      // .areas começa em 170svh: com 0px monta em ~70svh de scroll, ~100svh antes do fade do Hero.
      { rootMargin: '0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [reduzido, perto])

  const midiaDe = (area: Area): ReactNode =>
    renderMidia?.(area) ?? <ImagemComFallback className="area__img" src={area.imagem} alt={area.nome} />

  useGSAP(
    () => {
      if (reduzido) return
      const camadas = gsap.utils.toArray<HTMLElement>('.areas__camada')
      const secoes = gsap.utils.toArray<HTMLElement>('.area')
      camadas.forEach((camada, i) => {
        if (i === 0) return
        gsap.fromTo(
          camada,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: secoes[i],
              start: 'top bottom',
              end: 'top top',
              scrub: true,
            },
          },
        )
      })
    },
    { scope: containerRef, dependencies: [reduzido, areas.length], revertOnUpdate: true },
  )

  return (
    <div
      ref={containerRef}
      className="areas"
      data-estatico={reduzido ? 'true' : undefined}
      data-apos-hero={aposHero ? 'true' : undefined}
    >
      {!reduzido && (
        <div className="areas__palco">
          {areas.map((area) => (
            <div key={area.id} className="areas__camada">
              {perto && midiaDe(area)}
            </div>
          ))}
        </div>
      )}
      <div className={reduzido ? undefined : 'areas__secoes'}>
        {areas.map((area) =>
          reduzido ? (
            <AreaSection key={area.id} area={area} midia={midiaDe(area)} />
          ) : (
            <AreaSection key={area.id} area={area} semMidia />
          ),
        )}
      </div>
    </div>
  )
}
