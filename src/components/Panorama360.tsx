import { useEffect, useRef, useState } from 'react'
import { suportaWebGL } from '../lib/suportaWebGL'
import { ImagemComFallback } from './ImagemComFallback'
import './Panorama360.css'

interface Panorama360Props {
  panorama: string
  imagemPlana: string
  alt: string
}

export function Panorama360({ panorama, imagemPlana, alt }: Panorama360Props) {
  const raiz = useRef<HTMLDivElement>(null)
  const container = useRef<HTMLDivElement>(null)
  const [visivel, setVisivel] = useState(false)
  const [ativo, setAtivo] = useState(false)
  const [dicaVisivel, setDicaVisivel] = useState(true)

  useEffect(() => {
    const el = raiz.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisivel(true)
          obs.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visivel || !suportaWebGL()) return
    let cancelado = false
    let viewer: { destroy: () => void } | null = null
    const desistir = () => {
      viewer?.destroy()
      viewer = null
      setAtivo(false)
    }

    setDicaVisivel(true)
    setAtivo(true)
    // o container só existe depois do render com ativo=true
    const iniciar = async () => {
      try {
        const [{ Viewer }] = await Promise.all([
          import('@photo-sphere-viewer/core'),
          import('@photo-sphere-viewer/core/index.css'),
        ])
        if (cancelado) return
        if (!container.current) return desistir()
        const v = new Viewer({
          container: container.current,
          panorama,
          navbar: false,
          touchmoveTwoFingers: true,
          defaultZoomLvl: 0,
        })
        viewer = v
        v.addEventListener('panorama-error', () => {
          if (!cancelado) desistir()
        })
      } catch {
        if (!cancelado) desistir()
      }
    }
    void iniciar()
    return () => {
      cancelado = true
      viewer?.destroy()
      viewer = null
    }
  }, [visivel, panorama])

  return (
    <div ref={raiz} className="panorama">
      {ativo ? (
        <div
          className="panorama__viewer-area"
          onPointerDown={() => setDicaVisivel(false)}
          onTouchStart={() => setDicaVisivel(false)}
        >
          <div ref={container} className="panorama__viewer" />
          {dicaVisivel && (
            <p className="panorama__dica">
              <span>Arraste para olhar em volta</span>
            </p>
          )}
        </div>
      ) : (
        <ImagemComFallback className="area__img" src={imagemPlana} alt={alt} />
      )}
    </div>
  )
}
