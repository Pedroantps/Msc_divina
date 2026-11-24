import { act, renderHook } from '@testing-library/react'
import { useProgressoCapitulo } from './useProgressoCapitulo'

type Config = { onUpdate: (s: { progress: number }) => void; trigger: Element }
const criados: Config[] = []
const kill = vi.fn()

vi.mock('../lib/gsap', () => ({
  ScrollTrigger: {
    create: (c: Config) => {
      criados.push(c)
      return { kill }
    },
  },
}))

it('começa em 0, acompanha o ScrollTrigger e desliga ao desmontar', () => {
  const el = document.createElement('section')
  const { result, unmount } = renderHook(() => useProgressoCapitulo({ current: el }))
  expect(result.current).toBe(0)
  expect(criados.at(-1)?.trigger).toBe(el)

  act(() => criados.at(-1)!.onUpdate({ progress: 0.42137 }))
  expect(result.current).toBe(0.421)

  unmount()
  expect(kill).toHaveBeenCalled()
})

it('sem elemento não cria gatilho', () => {
  const antes = criados.length
  renderHook(() => useProgressoCapitulo({ current: null }))
  expect(criados.length).toBe(antes)
})
