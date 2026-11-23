import { useEffect, useState, type RefObject } from 'react'
import { ScrollTrigger } from '../lib/gsap'

/**
 * Progresso de rolagem (0–1) por dentro de um elemento: 0 quando o topo dele chega ao topo
 * da tela, 1 quando o fim dele chega ao fim da tela.
 * Funciona também com reduced motion: é um indicador de posição, não uma animação.
 */
export function useProgressoCapitulo(ref: RefObject<HTMLElement | null>): number {
  const [progresso, setProgresso] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const gatilho = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => setProgresso(Math.round(self.progress * 1000) / 1000),
      onRefresh: (self) => setProgresso(Math.round(self.progress * 1000) / 1000),
    })
    return () => gatilho.kill()
  }, [ref])

  return progresso
}
