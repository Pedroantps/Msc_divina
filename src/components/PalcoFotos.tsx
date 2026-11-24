import { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { ControlePalco, EstadoCamera, Vista } from '../lib/camera/tipos'
import './PalcoFotos.css'

const DESLOCAMENTO_MAX = 6 // % da largura

function normalizarYaw(yaw: number): number {
  // Intervalo (-180, 180]: 180 fica em +180, não em -180.
  return 180 - ((((180 - yaw) % 360) + 360) % 360)
}

/** Escala pelo campo de visão: 110° → 1,0; 55° → 1,25. */
function escalaDoFov(fov: number): number {
  return 1 + (110 - fov) / 220
}

function deslocamento(yaw: number): number {
  const d = -(normalizarYaw(yaw) / 180) * DESLOCAMENTO_MAX
  return Math.max(-DESLOCAMENTO_MAX, Math.min(DESLOCAMENTO_MAX, d))
}

/** Índices que ficam no DOM: a, b e a próxima cena. */
function indicesMontados(e: EstadoCamera, total: number): number[] {
  const ultima = e.b ? e.b.cena : e.a.cena
  const lista = [e.a.cena, e.b?.cena, ultima + 1].filter(
    (i): i is number => i !== undefined && i >= 0 && i < total,
  )
  return [...new Set(lista)].sort((x, y) => x - y)
}

function mesmosIndices(x: number[], y: number[]): boolean {
  return x.length === y.length && x.every((v, i) => v === y[i])
}

function aplicar(el: HTMLElement, vista: Vista, opacidade: number, z: number) {
  el.style.transform = `translateX(${deslocamento(vista.yaw)}%) scale(${escalaDoFov(vista.fov)})`
  el.style.opacity = String(opacidade)
  el.style.zIndex = String(z)
}

/** Palco de fotos: o fallback do palco WebGL, com a mesma interface imperativa. */
export const PalcoFotos = forwardRef<ControlePalco, { imagens: string[] }>(function PalcoFotos({ imagens }, ref) {
  const [montados, setMontados] = useState<number[]>(() => [0, 1].filter((i) => i < imagens.length))
  const elementos = useRef(new Map<number, HTMLImageElement>())
  const estado = useRef<EstadoCamera | null>(null)
  const montadosRef = useRef(montados)

  const pintar = useCallback(() => {
    const e = estado.current
    if (!e) return
    for (const [i, el] of elementos.current) {
      if (i === e.a.cena) aplicar(el, e.a, 1, 1)
      else if (e.b && i === e.b.cena) aplicar(el, e.b, e.mistura, 2)
      else el.style.opacity = '0'
    }
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      definirEstado(e: EstadoCamera) {
        estado.current = e
        const novos = indicesMontados(e, imagens.length)
        if (!mesmosIndices(montadosRef.current, novos)) {
          montadosRef.current = novos
          setMontados(novos)
        }
        pintar()
      },
    }),
    [imagens.length, pintar],
  )

  // Depois de montar uma foto nova, aplica o estado atual nela.
  useLayoutEffect(() => {
    pintar()
  }, [montados, pintar])

  return (
    <div className="palco-fotos" aria-hidden="true">
      {montados.map((i) => (
        <img
          key={i}
          ref={(el) => {
            if (el) elementos.current.set(i, el)
            else elementos.current.delete(i)
          }}
          className="palco-fotos__imagem"
          data-cena={i}
          src={imagens[i]}
          alt=""
          decoding="async"
          draggable={false}
        />
      ))}
    </div>
  )
})
