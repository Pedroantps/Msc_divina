import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { ImagemComFallback } from './ImagemComFallback'
import './Hero.css'

interface HeroProps {
  imagem: string
  alvo: { x: number; y: number }
}

export function Hero({ imagem, alvo }: HeroProps) {
  const secaoRef = useRef<HTMLElement>(null)
  const reduzido = useReducedMotion()

  useGSAP(
    () => {
      if (reduzido) return
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
      tl.fromTo('.hero__midia', { scale: 1, transformOrigin: `${alvo.x}% ${alvo.y}%` }, { scale: 3, transformOrigin: `${alvo.x}% ${alvo.y}%`, duration: 1 }, 0)
      tl.fromTo('.hero__titulo', { opacity: 1 }, { opacity: 0, duration: 1 / 3 }, 0)
      tl.to(secaoRef.current, { opacity: 0, duration: 0.15 }, 0.85)
    },
    { scope: secaoRef, dependencies: [reduzido, alvo.x, alvo.y], revertOnUpdate: true },
  )

  return (
    <section
      ref={secaoRef}
      className="hero"
      data-testid="hero"
      data-estatico={reduzido ? 'true' : undefined}
    >
      <div className="hero__palco">
        <div className="hero__midia">
          <ImagemComFallback
            className="hero__img"
            src={imagem}
            alt="O navio MSC Divina visto de fora"
          />
        </div>
        <div className="hero__degrade">
          <h1 className="hero__titulo">MSC Divina</h1>
        </div>
      </div>
    </section>
  )
}
