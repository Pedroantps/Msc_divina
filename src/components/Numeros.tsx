import { useRef, useState } from 'react'
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
  // null = mostra o valor final (padrão e movimento reduzido); array = contagem em andamento.
  // O React é o único dono do texto: o GSAP só anima números e o estado os repassa.
  const [exibidos, setExibidos] = useState<number[] | null>(null)

  useGSAP(
    (_contexto, contextSafe) => {
      if (reduzido || !raizRef.current || !contextSafe) return
      setExibidos(itens.map(() => 0))
      const gatilho = ScrollTrigger.create({
        trigger: raizRef.current,
        start: 'top 85%',
        once: true,
        onEnter: contextSafe(() => {
          itens.forEach((item, i) => {
            const contador = { v: 0 }
            gsap.to(contador, {
              v: item.valor,
              duration: 1,
              ease: 'power2.out',
              onUpdate: () => {
                const n = Math.round(contador.v)
                setExibidos((atual) => (atual && atual[i] !== n ? atual.map((x, j) => (j === i ? n : x)) : atual))
              },
              onComplete: () => {
                setExibidos((atual) => (atual ? atual.map((x, j) => (j === i ? item.valor : x)) : atual))
              },
            })
          })
        }),
      })
      return () => {
        gatilho.kill()
        setExibidos(null)
      }
    },
    { scope: raizRef, dependencies: [reduzido, itens], revertOnUpdate: true },
  )

  return (
    <ul ref={raizRef} className="numeros" aria-label="Números do site">
      {itens.map((item, i) => (
        <li key={item.legenda} className="numeros__item">
          {/* O valor final fica no DOM para leitores de tela desde o início. */}
          <span className="numeros__sr">
            {item.valor} {item.legenda}
          </span>
          <span className="numeros__valor" aria-hidden="true">
            {exibidos ? (exibidos[i] ?? item.valor) : item.valor}
          </span>
          <span className="numeros__legenda" aria-hidden="true">
            {item.legenda}
          </span>
        </li>
      ))}
    </ul>
  )
}
