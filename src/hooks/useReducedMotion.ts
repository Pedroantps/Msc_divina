import { useEffect, useState } from 'react'

const CONSULTA = '(prefers-reduced-motion: reduce)'

function ler(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(CONSULTA).matches
}

export function useReducedMotion(): boolean {
  const [reduzido, setReduzido] = useState<boolean>(ler)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(CONSULTA)
    const aoMudar = (e: MediaQueryListEvent) => setReduzido(e.matches)
    setReduzido(mql.matches)
    mql.addEventListener('change', aoMudar)
    return () => mql.removeEventListener('change', aoMudar)
  }, [])

  return reduzido
}
