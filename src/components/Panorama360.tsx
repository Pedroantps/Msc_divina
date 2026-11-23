import { useEffect, useRef, useState } from 'react'
import { suportaWebGL } from '../lib/suportaWebGL'
import { ImagemComFallback } from './ImagemComFallback'
import './Panorama360.css'

const LANG_PT = {
  zoom: 'Zoom',
  zoomOut: 'Diminuir zoom',
  zoomIn: 'Aumentar zoom',
  moveUp: 'Mover para cima',
  moveDown: 'Mover para baixo',
  moveLeft: 'Mover para a esquerda',
  moveRight: 'Mover para a direita',
  description: 'Descrição',
  download: 'Baixar',
  fullscreen: 'Tela cheia',
  loading: 'Carregando...',
  menu: 'Menu',
  close: 'Fechar',
  twoFingers: 'Use dois dedos para olhar em volta',
  ctrlZoom: 'Use ctrl + rolagem para aproximar a imagem',
  loadError: 'Não foi possível carregar o panorama',
  webglError: 'Seu navegador não parece oferecer suporte a WebGL',
}

const telaDeToque = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches

interface Panorama360Props {
  panorama: string
  imagemPlana: string
  alt: string
  /** Id do elemento observado no lugar do próprio (ex.: a seção da área). */
  ancora?: string
  /** Para onde a câmera olha ao abrir, em graus. */
  yaw?: number
}

export function Panorama360({ panorama, imagemPlana, alt, ancora, yaw = 0 }: Panorama360Props) {
  const raiz = useRef<HTMLDivElement>(null)
  const container = useRef<HTMLDivElement>(null)
  const falhou = useRef(false)
  const [visivel, setVisivel] = useState(false)
  const [ativo, setAtivo] = useState(false)
  const [dicaVisivel, setDicaVisivel] = useState(true)
  const textoDica = telaDeToque() ? 'Use dois dedos para olhar em volta' : 'Arraste para olhar em volta'

  // Liga quando o âncora chega a 200px da tela; desliga quando sai por inteiro
  // de uma folga de 1 tela. Assim só os viewers das áreas próximas ficam vivos.
  useEffect(() => {
    const el = (ancora ? document.getElementById(ancora) : null) ?? raiz.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const entrar = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) setVisivel(true)
      },
      { rootMargin: '200px' },
    )
    const sair = new IntersectionObserver(
      (entradas) => {
        if (entradas.length > 0 && entradas.every((e) => !e.isIntersecting)) setVisivel(false)
      },
      { rootMargin: '100% 0px' },
    )
    entrar.observe(el)
    sair.observe(el)
    return () => {
      entrar.disconnect()
      sair.disconnect()
    }
  }, [ancora])

  useEffect(() => {
    if (!visivel) {
      setAtivo(false)
      return
    }
    if (falhou.current || !suportaWebGL()) return
    let cancelado = false
    let viewer: { destroy: () => void } | null = null
    const desistir = () => {
      falhou.current = true
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
          mousewheel: false,
          lang: LANG_PT,
          defaultZoomLvl: 0,
          defaultYaw: `${yaw}deg`,
        })
        viewer = v
        v.addEventListener('panorama-error', () => {
          if (!cancelado) desistir()
        })
        // Memória de GPU esgotada em celular fraco: volta para a foto plana.
        container.current
          .querySelector('canvas')
          ?.addEventListener('webglcontextlost', () => {
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
  }, [visivel, panorama, yaw])

  return (
    <div ref={raiz} className="panorama">
      {ativo ? (
        <div
          className="panorama__viewer-area"
          role="group"
          aria-label={alt}
          onPointerDown={() => setDicaVisivel(false)}
          onTouchStart={() => setDicaVisivel(false)}
        >
          <div ref={container} className="panorama__viewer" />
          {dicaVisivel && (
            <p className="panorama__dica">
              <span>{textoDica}</span>
            </p>
          )}
        </div>
      ) : (
        <ImagemComFallback className="area__img" src={imagemPlana} alt={alt} />
      )}
    </div>
  )
}
