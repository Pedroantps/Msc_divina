import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Barra de endereço do celular some/aparece ao rolar: não recalcular por isso.
ScrollTrigger.config({ ignoreMobileResize: true })

// Girar o aparelho muda o layout de verdade: recalcular uma vez.
if (typeof window !== 'undefined') {
  window.addEventListener('orientationchange', () => ScrollTrigger.refresh())
}

export { gsap, ScrollTrigger, useGSAP }
