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
  /** Quanto o zoom aproxima do alvo no fim da rolagem. */
  zoom?: number
  /** Largura/altura da foto, usada até a imagem carregar. */
  proporcao?: number
}

export function Hero({
  imagem,
  alt = 'O navio MSC Divina visto de fora',
  alvo,
  subtitulo = 'Cruzeiro em família · Búzios',
  zoom = 12,
  proporcao = 1.5,
}: HeroProps) {
  const secaoRef = useRef<HTMLElement>(null)
  const reduzido = useReducedMotion()

  useGSAP(
    () => {
      if (reduzido) return
      const midia = secaoRef.current?.querySelector<HTMLElement>('.hero__midia')
      const img = midia?.querySelector('img')
      if (!midia) return

      // Onde o alvo cai na tela (px), considerando o recorte do object-fit: cover e o object-position.
      const alvoNaTela = () => {
        const W = midia.offsetWidth
        const H = midia.offsetHeight
        const r = img && img.naturalWidth > 0 && img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : proporcao
        const w = Math.max(W, H * r)
        const h = w / r
        const pos = img ? getComputedStyle(img).objectPosition.split(' ').map(parseFloat) : []
        const px = Number.isFinite(pos[0]) ? pos[0] : 50
        const py = Number.isFinite(pos[1]) ? pos[1] : 50
        return {
          W,
          H,
          x: (W - w) * (px / 100) + (alvo.x / 100) * w,
          y: (H - h) * (py / 100) + (alvo.y / 100) * h,
        }
      }

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
      // Aproximação: o zoom acelera (como quem avança) e o alvo (a janela do casco) vai para o centro da tela.
      tl.fromTo(
        midia,
        { scale: 1, x: 0, y: 0, transformOrigin: () => `${alvoNaTela().x}px ${alvoNaTela().y}px` },
        {
          scale: zoom,
          x: () => alvoNaTela().W / 2 - alvoNaTela().x,
          y: () => alvoNaTela().H / 2 - alvoNaTela().y,
          transformOrigin: () => `${alvoNaTela().x}px ${alvoNaTela().y}px`,
          ease: 'power3.in',
          duration: 1,
        },
        0,
      )
      tl.fromTo('.hero__titulo', { opacity: 1, yPercent: 0 }, { opacity: 0, yPercent: -25, duration: 0.3 }, 0)
      tl.fromTo('.hero__subtitulo', { opacity: 1 }, { opacity: 0, duration: 0.2 }, 0)
      // Entra pela janela: tudo escurece até quase o fim e então o palco some, revelando a Recepção que já está por baixo.
      tl.fromTo('.hero__escurecer', { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.65)
      tl.fromTo('.hero__palco', { opacity: 1 }, { opacity: 0, duration: 0.12 }, 0.84)
    },
    { scope: secaoRef, dependencies: [reduzido, alvo.x, alvo.y, zoom, proporcao], revertOnUpdate: true },
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
