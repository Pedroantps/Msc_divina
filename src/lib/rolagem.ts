import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'

// Instância única de Lenis para o site todo.
let lenis: Lenis | null = null

/** Cria o Lenis, liga ao ticker do GSAP e ao ScrollTrigger. Devolve a limpeza. */
export function iniciarRolagemSuave(): () => void {
  // O Lenis mede a página com ResizeObserver: sem ele (navegador antigo, jsdom) fica a rolagem nativa.
  if (typeof ResizeObserver === 'undefined') return () => {}
  if (lenis) lenis.destroy()
  const instancia = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, autoRaf: false })
  lenis = instancia

  instancia.on('scroll', ScrollTrigger.update)
  const aoQuadro = (tempo: number) => instancia.raf(tempo * 1000)
  gsap.ticker.add(aoQuadro)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(aoQuadro)
    gsap.ticker.lagSmoothing(500, 33)
    instancia.destroy()
    if (lenis === instancia) lenis = null
  }
}

/** Liga a rolagem suave enquanto `ativo` (o App passa `!reduzido`). */
export function useRolagemSuave(ativo: boolean): void {
  useEffect(() => {
    if (!ativo) return
    return iniciarRolagemSuave()
  }, [ativo])
}

interface OpcoesRolagem {
  bloco?: 'start' | 'center'
  imediato?: boolean
}

/** Rola até o alvo (elemento ou seletor). Sem Lenis ativo, usa o scrollIntoView nativo. */
export function rolarPara(alvo: HTMLElement | string, opcoes: OpcoesRolagem = {}): void {
  const { bloco = 'start', imediato = false } = opcoes
  const el = typeof alvo === 'string' ? document.querySelector<HTMLElement>(alvo) : alvo
  if (!el) return
  if (!lenis) {
    el.scrollIntoView({ block: bloco, behavior: 'auto' })
    return
  }
  const offset = bloco === 'center' ? -(window.innerHeight - el.getBoundingClientRect().height) / 2 : 0
  lenis.scrollTo(el, { offset, immediate: imediato })
}

/** Rola até uma posição absoluta do documento, sem animação (pula direto, inclusive com o Lenis ativo). */
export function rolarParaPosicao(top: number): void {
  if (lenis) lenis.scrollTo(top, { immediate: true })
  else window.scrollTo({ top, behavior: 'auto' })
}

export function pausarRolagem(): void {
  lenis?.stop()
}

export function retomarRolagem(): void {
  lenis?.start()
}
