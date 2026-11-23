import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'
import type { ItemNumero } from '../data/numeros'
import './Numeros.css'

interface NumerosProps {
  itens: ItemNumero[]
}

/** Fileira de números grandes que contam de 0 até o valor ao entrar na tela (uma vez). */
export function Numeros({ itens }: NumerosProps) {
  const raizRef = useRef<HTMLUListElement>(null)
  const reduzido = useReducedMotion()

  useGSAP(
    () => {
      if (reduzido || !raizRef.current) return
      const raiz = raizRef.current
      const alvos = Array.from(raiz.querySelectorAll<HTMLElement>('.numeros__valor'))
      alvos.forEach((el) => {
        el.textContent = '0'
      })
      ScrollTrigger.create({
        trigger: raiz,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          itens.forEach((item, i) => {
            const contador = { v: 0 }
            gsap.to(contador, {
              v: item.valor,
              duration: 1,
              ease: 'power2.out',
              onUpdate: () => {
                alvos[i].textContent = String(Math.round(contador.v))
              },
              onComplete: () => {
                alvos[i].textContent = String(item.valor)
              },
            })
          })
        },
      })
    },
    { scope: raizRef, dependencies: [reduzido, itens], revertOnUpdate: true },
  )

  return (
    <ul ref={raizRef} className="numeros" aria-label="Números do site">
      {itens.map((item) => (
        <li key={item.legenda} className="numeros__item">
          {/* O valor final fica no DOM para leitores de tela desde o início. */}
          <span className="numeros__sr">
            {item.valor} {item.legenda}
          </span>
          <span className="numeros__valor" aria-hidden="true">
            {item.valor}
          </span>
          <span className="numeros__legenda" aria-hidden="true">
            {item.legenda}
          </span>
        </li>
      ))}
    </ul>
  )
}
