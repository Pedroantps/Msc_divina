import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { ImagemComFallback } from './ImagemComFallback'
import './Hero.css'

interface HeroProps {
  imagem: string
  alt?: string
  alvo: { x: number; y: number }
  subtitulo?: string
}

export function Hero({
  imagem,
  alt = 'O navio MSC Divina visto de fora',
  alvo,
  subtitulo = 'Cruzeiro em família · Búzios',
}: HeroProps) {
  const secaoRef = useRef<HTMLElement>(null)
  const reduzido = useReducedMotion()

  useGSAP(
    () => {
      if (reduzido) return
      const origem = `${alvo.x}% ${alvo.y}%`
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: secaoRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      tl.fromTo('.hero__midia', { scale: 1, transformOrigin: origem }, { scale: 2.6, transformOrigin: origem, duration: 1 }, 0)
      tl.fromTo('.hero__titulo', { opacity: 1, yPercent: 0 }, { opacity: 0, yPercent: -25, duration: 0.3 }, 0)
      tl.fromTo('.hero__subtitulo', { opacity: 1 }, { opacity: 0, duration: 0.2 }, 0)
      // Corta limpo para a próxima seção: nos últimos ~15% da rolagem tudo escurece até a cor-base-escura.
      tl.fromTo('.hero__escurecer', { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0.85)
    },
    { scope: secaoRef, dependencies: [reduzido, alvo.x, alvo.y], revertOnUpdate: true },
  )

  return (
    <section
      ref={secaoRef}
      className="hero"
      data-testid="hero"
      data-tema="escuro"
      data-estatico={reduzido ? 'true' : undefined}
    >
      <div className="hero__palco">
        <div className="hero__midia">
          <ImagemComFallback
            className="hero__img"
            src={imagem}
            alt={alt}
            loading="eager"
            fetchpriority="high"
          />
        </div>
        <div className="hero__degrade-topo" aria-hidden="true" />
        <div className="hero__degrade" aria-hidden="true" />
        <p className="hero__subtitulo rotulo">{subtitulo}</p>
        <h1 className="hero__titulo">
          <span className="hero__selo rotulo">MSC</span>{' '}
          <span className="hero__palavra exibicao">Divina</span>
        </h1>
        <div className="hero__escurecer" aria-hidden="true" />
      </div>
    </section>
  )
}
