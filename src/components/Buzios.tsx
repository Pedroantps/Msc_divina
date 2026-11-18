import type { Area } from '../data/tipos'
import { capas } from '../data/capas'
import { AreasDoNavio } from './AreasDoNavio'
import { ImagemComFallback } from './ImagemComFallback'
import './Buzios.css'

interface BuziosProps {
  lugares: Area[]
}

export function Buzios({ lugares }: BuziosProps) {
  return (
    <section className="buzios" aria-labelledby="buzios-titulo">
      <header className="buzios__abertura">
        <ImagemComFallback
          className="buzios__img"
          src={capas.buzios.imagem}
          alt={capas.buzios.alt}
        />
        <div className="buzios__texto">
          <h2 id="buzios-titulo" className="buzios__titulo">Um dia em Búzios</h2>
          <p className="buzios__aviso">Volta ao navio antes das 16h (confirme no seu bilhete).</p>
        </div>
      </header>
      <AreasDoNavio areas={lugares} />
    </section>
  )
}
