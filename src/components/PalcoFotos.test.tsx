import { Profiler, createRef } from 'react'
import { act, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PalcoFotos } from './PalcoFotos'
import type { ControlePalco, Vista } from '../lib/camera/tipos'

const imagens = ['/img/0.webp', '/img/1.webp', '/img/2.webp', '/img/3.webp', '/img/4.webp']
const vista = (cena: number, fov = 110, yaw = 0): Vista => ({ cena, yaw, pitch: 0, fov })
const img = (c: HTMLElement, i: number) => c.querySelector<HTMLImageElement>(`img[data-cena="${i}"]`)

function montar() {
  const ref = createRef<ControlePalco>()
  let renders = 0
  const r = render(
    <Profiler id="p" onRender={() => renders++}>
      <PalcoFotos ref={ref} imagens={imagens} />
    </Profiler>,
  )
  return { ref, r, renders: () => renders }
}

describe('PalcoFotos', () => {
  it('mostra a imagem de a com escala pelo fov', () => {
    const { ref, r } = montar()
    act(() => ref.current!.definirEstado({ a: vista(2, 110), b: null, mistura: 0 }))
    expect(img(r.container, 2)!.style.opacity).toBe('1')
    expect(img(r.container, 2)!.style.transform).toContain('scale(1)')
    act(() => ref.current!.definirEstado({ a: vista(2, 55), b: null, mistura: 0 }))
    expect(img(r.container, 2)!.style.transform).toContain('scale(1.25)')
  })

  it('desloca na horizontal pelo yaw, limitado a 6%', () => {
    const { ref, r } = montar()
    act(() => ref.current!.definirEstado({ a: vista(2, 110, 90), b: null, mistura: 0 }))
    expect(img(r.container, 2)!.style.transform).toContain('translateX(-3%)')
    act(() => ref.current!.definirEstado({ a: vista(2, 110, 180), b: null, mistura: 0 }))
    expect(img(r.container, 2)!.style.transform).toContain('translateX(-6%)')
  })

  it('com b e mistura 0,4, a imagem de b fica com opacidade 0,4', () => {
    const { ref, r } = montar()
    act(() => ref.current!.definirEstado({ a: vista(2), b: vista(3), mistura: 0.4 }))
    expect(img(r.container, 3)!.style.opacity).toBe('0.4')
    expect(img(r.container, 2)!.style.opacity).toBe('1')
  })

  it('mantém só a, b e a próxima no DOM', () => {
    const { ref, r } = montar()
    act(() => ref.current!.definirEstado({ a: vista(2), b: vista(3), mistura: 0.4 }))
    const cenas = [...r.container.querySelectorAll('img')].map((e) => e.dataset.cena)
    expect(cenas).toEqual(['2', '3', '4'])
  })

  it('não re-renderiza a cada atualização com os mesmos índices', () => {
    const { ref, renders } = montar()
    act(() => ref.current!.definirEstado({ a: vista(2), b: null, mistura: 0 }))
    const antes = renders()
    for (let i = 0; i < 20; i++) {
      act(() => ref.current!.definirEstado({ a: vista(2, 100 - i, i), b: null, mistura: 0 }))
    }
    expect(renders()).toBe(antes)
  })
})
