import { useRef, type ReactNode } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'
import type { Area } from '../data/tipos'
import { AreaSection } from './AreaSection'
import { ImagemComFallback } from './ImagemComFallback'
import './AreasDoNavio.css'

interface AreasDoNavioProps {
  areas: Area[]
  renderMidia?: (area: Area) => ReactNode
}

export function AreasDoNavio({ areas, renderMidia }: AreasDoNavioProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const reduzido = useReducedMotion()

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
    >
      {!reduzido && (
        <div className="areas__palco">
          {areas.map((area) => (
            <div key={area.id} className="areas__camada">
              {midiaDe(area)}
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
