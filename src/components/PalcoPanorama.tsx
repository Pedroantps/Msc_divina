import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { criarMotor } from '../lib/camera/motor'
import type { Motor } from '../lib/camera/motor'
import type { ControlePalco, EstadoCamera } from '../lib/camera/tipos'
import './PalcoPanorama.css'

interface PalcoPanoramaProps {
  /** Um panorama por cena, já na variante da capacidade (ver `panoramaPara`). */
  panoramas: string[]
  /** A foto de cada cena, mostrada por baixo do canvas até a textura chegar. */
  posteres: string[]
  dpr: number
  /** WebGL indisponível ou contexto perdido: quem usa troca para o palco de fotos. */
  aoFalhar: () => void
}

const CLASSE_PRONTO = 'palco-panorama__canvas--pronto'
/** Duração do fade do canvas (PalcoPanorama.css): o pôster só some depois dele. */
const FADE_CANVAS = 400

/**
 * Palco WebGL do Percurso: o panorama 360° num canvas controlado pela rolagem.
 * A API é imperativa (`ref.definirEstado`, `ref.liberar`) e nada passa pelo estado do React a cada quadro.
 */
export const PalcoPanorama = forwardRef<ControlePalco, PalcoPanoramaProps>(function PalcoPanorama(
  { panoramas, posteres, dpr, aoFalhar },
  ref,
) {
  const raiz = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const poster = useRef<HTMLImageElement>(null)
  const motor = useRef<Motor | null>(null)
  const ultimo = useRef<EstadoCamera | null>(null)

  // Valores mais recentes, lidos pelo motor e pelo handle sem recriá-los.
  const aoFalharAtual = useRef(aoFalhar)
  const posteresAtuais = useRef(posteres)
  const panoramasAtuais = useRef(panoramas)
  const dprAtual = useRef(dpr)
  useEffect(() => {
    aoFalharAtual.current = aoFalhar
    posteresAtuais.current = posteres
    panoramasAtuais.current = panoramas
    dprAtual.current = dpr
  })

  const chavePanoramas = panoramas.join('|')

  useEffect(() => {
    const el = canvas.current!
    const caixa = raiz.current!
    let timerPoster: ReturnType<typeof setTimeout> | undefined

    // Com a cena `a` na tela o pôster sai (deixa de ser composto por baixo do canvas);
    // volta na hora se ela some ou se o motor falha. Só `b` em mistura baixa não basta.
    const mostrar = (pronto: boolean, aPronta = pronto) => {
      clearTimeout(timerPoster)
      el.classList.toggle(CLASSE_PRONTO, pronto)
      if (!aPronta) {
        if (poster.current) poster.current.hidden = false
        return
      }
      timerPoster = setTimeout(() => {
        if (poster.current) poster.current.hidden = true
      }, FADE_CANVAS)
    }

    let vivo: Motor
    try {
      vivo = criarMotor(el, panoramasAtuais.current, {
        dpr: dprAtual.current,
        aoFalhar: () => {
          mostrar(false)
          aoFalharAtual.current()
        },
        aoPronto: (pronto, { aPronta }) => mostrar(pronto, aPronta),
      })
    } catch (erro) {
      console.error(erro)
      aoFalharAtual.current()
      return
    }
    motor.current = vivo
    vivo.redimensionar(caixa.clientWidth, caixa.clientHeight)
    if (ultimo.current) vivo.definirEstado(ultimo.current)

    let observador: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      observador = new ResizeObserver((entradas) => {
        const { width, height } = entradas[entradas.length - 1].contentRect
        vivo.redimensionar(Math.round(width), Math.round(height))
      })
      observador.observe(caixa)
    }
    return () => {
      observador?.disconnect()
      vivo.destruir()
      motor.current = null
      mostrar(false)
    }
  }, [chavePanoramas])

  // Mudar o dpr só ajusta o renderer: recriar o motor perderia as texturas já na GPU.
  useEffect(() => {
    motor.current?.definirDpr(dpr)
  }, [dpr])

  useImperativeHandle(
    ref,
    () => ({
      definirEstado(e) {
        const anterior = ultimo.current
        ultimo.current = e
        if (!anterior || anterior.a.cena !== e.a.cena) {
          const src = posteresAtuais.current[e.a.cena]
          if (poster.current && src && poster.current.getAttribute('src') !== src) poster.current.src = src
        }
        motor.current?.definirEstado(e)
      },
      liberar() {
        motor.current?.liberar()
      },
    }),
    [],
  )

  return (
    <div ref={raiz} className="palco-panorama" aria-hidden="true">
      <img ref={poster} className="palco-panorama__poster" src={posteres[0]} alt="" decoding="async" />
      <canvas ref={canvas} className="palco-panorama__canvas" />
    </div>
  )
})
