import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'
import './RotaSvg.css'

/** Traço sinuoso estilizado (não é um mapa), de cima a baixo. */
const CAMINHO =
  'M 20 10 C 80 60, 10 120, 60 200 S 90 320, 40 420 S 10 560, 70 660 S 90 800, 40 900 S 30 960, 60 990'

/**
 * Linha fina de acento que atravessa a seção em que está (o elemento pai, que precisa
 * ter `position: relative`) e vai sendo desenhada conforme a rolagem.
 * Com movimento reduzido fica desenhada por inteiro.
 */
export function RotaSvg({ inicio = 'Santos', fim = 'Búzios' }: { inicio?: string; fim?: string }) {
  const raizRef = useRef<HTMLDivElement>(null)
  const caminhoRef = useRef<SVGPathElement>(null)
  const reduzido = useReducedMotion()

  useGSAP(
    () => {
      if (reduzido || !caminhoRef.current) return
      gsap.fromTo(
        caminhoRef.current,
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: raizRef.current?.parentElement ?? raizRef.current,
            start: 'top 60%',
            end: 'bottom 70%',
            scrub: true,
          },
        },
      )
    },
    { scope: raizRef, dependencies: [reduzido], revertOnUpdate: true },
  )

  return (
    <div ref={raizRef} className="rota" aria-hidden="true">
      <svg className="rota__svg" viewBox="0 0 100 1000" preserveAspectRatio="none" focusable="false">
        <path
          ref={caminhoRef}
          className="rota__linha"
          d={CAMINHO}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={reduzido ? 0 : 1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="rota__marcador rota__marcador--inicio rotulo">{inicio}</span>
      <span className="rota__marcador rota__marcador--fim rotulo">{fim}</span>
    </div>
  )
}
