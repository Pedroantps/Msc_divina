import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gsap } from '../lib/gsap'
import { areasDoNavio } from '../data/areas'
import { AreasDoNavio } from './AreasDoNavio'

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

it('renderiza uma seção por área com título e deck', () => {
  mockMatchMedia(false)
  render(<AreasDoNavio areas={areasDoNavio} />)
  expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(areasDoNavio.length)
  expect(screen.getByText(`Deck ${areasDoNavio[0].deck}`)).toBeInTheDocument()
})

it('usa renderMidia quando fornecido', () => {
  mockMatchMedia(false)
  const originalIO = window.IntersectionObserver
  let cb: IntersectionObserverCallback | null = null
  window.IntersectionObserver = vi.fn(function (c: IntersectionObserverCallback) {
    cb = c
    return { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn(), takeRecords: () => [] }
  }) as unknown as typeof IntersectionObserver
  try {
    render(<AreasDoNavio areas={areasDoNavio.slice(0, 1)} renderMidia={() => <p>mídia custom</p>} />)
    act(() => {
      cb?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    })
  } finally {
    window.IntersectionObserver = originalIO
  }
  expect(screen.getByText('mídia custom')).toBeInTheDocument()
})

it('com movimento reduzido todas as seções ficam visíveis e cada uma mostra sua mídia', () => {
  mockMatchMedia(true)
  const espiao = vi.spyOn(gsap, 'fromTo')
  render(<AreasDoNavio areas={areasDoNavio} />)
  const secoes = screen.getAllByRole('region')
  expect(secoes).toHaveLength(areasDoNavio.length)
  secoes.forEach((s) => expect(s).not.toHaveStyle({ opacity: '0' }))
  expect(screen.getAllByRole('img')).toHaveLength(areasDoNavio.length)
  expect(espiao).not.toHaveBeenCalled()
})

it('sem movimento reduzido cria um tween com scrollTrigger por camada após a primeira', () => {
  mockMatchMedia(false)
  const espiao = vi.spyOn(gsap, 'fromTo')
  render(<AreasDoNavio areas={areasDoNavio} />)
  expect(espiao).toHaveBeenCalledTimes(areasDoNavio.length - 1)
  expect(espiao).toHaveBeenCalledWith(
    expect.anything(),
    { autoAlpha: 0 },
    expect.objectContaining({
      autoAlpha: 1,
      scrollTrigger: expect.objectContaining({ scrub: true }),
    }),
  )
})

describe('carregamento da mídia do palco', () => {
  const originalIO = window.IntersectionObserver
  let callback: IntersectionObserverCallback | null = null

  beforeEach(() => {
    callback = null
    window.IntersectionObserver = vi.fn(function (cb: IntersectionObserverCallback) {
      callback = cb
      return { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn(), takeRecords: () => [] }
    }) as unknown as typeof IntersectionObserver
  })

  afterEach(() => {
    window.IntersectionObserver = originalIO
  })

  it('só monta as imagens das camadas quando o container chega perto da tela', () => {
    mockMatchMedia(false)
    const { container } = render(<AreasDoNavio areas={areasDoNavio} />)
    expect(container.querySelectorAll('.areas__camada')).toHaveLength(areasDoNavio.length)
    expect(container.querySelectorAll('.areas__camada img')).toHaveLength(0)
    act(() => {
      callback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    })
    expect(container.querySelectorAll('.areas__camada img')).toHaveLength(areasDoNavio.length)
  })

  it('com movimento reduzido a mídia aparece sem esperar o observer', () => {
    mockMatchMedia(true)
    render(<AreasDoNavio areas={areasDoNavio} />)
    expect(screen.getAllByRole('img')).toHaveLength(areasDoNavio.length)
  })
})
