import type { ReactNode } from 'react'
import type { Area } from '../data/tipos'
import { ImagemComFallback } from './ImagemComFallback'
import './AreaSection.css'

interface AreaSectionProps {
  area: Area
  /** Substitui a foto (ex.: panorama 360°). */
  midia?: ReactNode
  /** Quando a mídia já é desenhada fora da seção (palco do crossfade). */
  semMidia?: boolean
}

export function AreaSection({ area, midia, semMidia = false }: AreaSectionProps) {
  const tituloId = `${area.id}-titulo`
  return (
    <section id={area.id} aria-labelledby={tituloId} className="area">
      {!semMidia && (
        <div className="area__midia">
          {midia ?? <ImagemComFallback className="area__img" src={area.imagem} alt={area.nome} />}
        </div>
      )}
      <div className="area__texto">
        {area.deck !== undefined && <p className="area__deck">Deck {area.deck}</p>}
        <h2 id={tituloId} className="area__titulo">
          {area.nome}
        </h2>
        <p className="area__descricao">{area.descricao}</p>
      </div>
    </section>
  )
}
