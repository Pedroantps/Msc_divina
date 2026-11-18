import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { useReducedMotion } from './useReducedMotion'

const original = window.matchMedia

function mockMatchMedia(matches: boolean) {
  let ouvinte: ((e: MediaQueryListEvent) => void) | undefined
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
      ouvinte = cb
    },
    removeEventListener: () => {
      ouvinte = undefined
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  return (novo: boolean) => ouvinte?.({ matches: novo } as MediaQueryListEvent)
}

afterEach(() => {
  window.matchMedia = original
})

it('retorna true quando o sistema pede menos movimento', () => {
  mockMatchMedia(true)
  const { result } = renderHook(() => useReducedMotion())
  expect(result.current).toBe(true)
})

it('atualiza quando a preferência muda', () => {
  const disparar = mockMatchMedia(false)
  const { result } = renderHook(() => useReducedMotion())
  expect(result.current).toBe(false)
  act(() => disparar(true))
  expect(result.current).toBe(true)
})
