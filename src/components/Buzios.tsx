import { useRef } from 'react'
import type { Area } from '../data/tipos'
import { areasDoNavio } from '../data/areas'
import { capas } from '../data/capas'
import { calcularNumeros } from '../data/numeros'
import { gsap, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { ImagemComFallback } from './ImagemComFallback'
import { Numeros } from './Numeros'
import './Buzios.css'

type LugarComFrase = Area & { frase?: string }

interface BuziosProps {
  lugares: LugarComFrase[]
  /** Foto da abertura. Padrão: a capa de Búzios de `capas`. */
  capa?: { imagem: string; alt: string }
  id?: string
}

export function Buzios({ lugares, capa = capas.buzios, id = 'capitulo-buzios' }: BuziosProps) {
  const secaoRef = useRef<HTMLElement>(null)
  const aberturaRef = useRef<HTMLElement>(null)
  const reduzido = useReducedMotion()

  useGSAP(
    () => {
      if (reduzido || !aberturaRef.current) return
      gsap.fromTo(
        '.buzios__midia',
        { yPercent: -6, scale: 1.02 },
        {
          yPercent: 6,
          scale: 1.12,
          ease: 'none',
          scrollTrigger: {
            trigger: aberturaRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      )
    },
    { scope: secaoRef, dependencies: [reduzido], revertOnUpdate: true },
  )

  // Números do capítulo: áreas e cenas do navio mais os lugares desta lista.
  const numeros = calcularNumeros(areasDoNavio, lugares)

  return (
    <section
      ref={secaoRef}
      id={id}
      className="buzios"
      data-tema="claro"
      data-estatico={reduzido ? 'true' : undefined}
      aria-labelledby={`${id}-titulo`}
    >
      <header ref={aberturaRef} className="buzios__abertura">
        <div className="buzios__midia">
          <ImagemComFallback className="buzios__img" src={capa.imagem} alt={capa.alt} />
        </div>
        <div className="buzios__capa-texto">
          <h2 id={`${id}-titulo`} className="buzios__palavra exibicao">Búzios</h2>
          <p className="buzios__subtitulo">Escala do cruzeiro — praias, ruas e pôr do sol</p>
        </div>
      </header>

      <div className="buzios__numeros">
        <Numeros itens={numeros} />
      </div>

      <div className="buzios__lugares">
        {lugares.map((lugar, i) => (
          <article
            key={lugar.id}
            id={lugar.id}
            className={`buzios__lugar${i % 2 === 1 ? ' buzios__lugar--invertido' : ''}`}
          >
            <div className="buzios__foto">
              <ImagemComFallback className="buzios__foto-img" src={lugar.imagem} alt={lugar.nome} />
            </div>
            <div className="buzios__corpo">
              <p className="buzios__frase">{lugar.frase ?? lugar.nome}</p>
              <h3 className="buzios__nome rotulo">{lugar.nome}</h3>
              <p className="buzios__descricao">{lugar.descricao}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
