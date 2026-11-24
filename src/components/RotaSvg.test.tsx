import { render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { gsap } from '../lib/gsap'
import { RotaSvg } from './RotaSvg'

const original = window.matchMedia

function mockMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}

afterEach(() => {
  vi.restoreAllMocks()
  window.matchMedia = original
})

it('é decorativa: aria-hidden e com os marcadores Santos e Búzios', () => {
  mockMatchMedia(false)
  const { container } = render(<RotaSvg />)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  expect(container.textContent).toContain('Santos')
  expect(container.textContent).toContain('Búzios')
})

it('sem movimento reduzido desenha a linha pela rolagem (scrub)', () => {
  mockMatchMedia(false)
  const espiao = vi.spyOn(gsap, 'fromTo')
  render(<RotaSvg />)
  expect(espiao).toHaveBeenCalledWith(
    expect.anything(),
    { strokeDashoffset: 1 },
    expect.objectContaining({ strokeDashoffset: 0, scrollTrigger: expect.objectContaining({ scrub: true }) }),
  )
})

it('com movimento reduzido não anima e a linha fica inteira', () => {
  mockMatchMedia(true)
  const espiao = vi.spyOn(gsap, 'fromTo')
  const { container } = render(<RotaSvg />)
  expect(espiao).not.toHaveBeenCalled()
  expect(container.querySelector('path')).toHaveAttribute('stroke-dashoffset', '0')
})
