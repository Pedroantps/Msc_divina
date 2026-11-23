import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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

/** O pedaço do viewer e do plugin de giroscópio que este componente usa. */
interface ViewerVivo {
  destroy: () => void
  setPanorama?: (caminho: string, opcoes?: object) => Promise<unknown>
  getPlugin?: (plugin: unknown) => GiroVivo | undefined
}
interface GiroVivo {
  isSupported: () => Promise<boolean>
  toggle: () => void
  addEventListener: (tipo: string, fn: (e: { gyroscopeEnabled: boolean }) => void) => void
}

interface Panorama360Props {
  panorama: string
  imagemPlana: string
  alt: string
  /** Para onde a câmera olha ao abrir esta cena, em graus. */
  yaw?: number
  /**
   * Liga e desliga o viewer (ex.: o tour só vive com o modal aberto). Trocar `panorama`/`yaw`
   * com o viewer ligado usa setPanorama, sem recriá-lo. Se omitido, vale o modo da fase 1:
   * liga quando a `ancora` chega perto da tela e desliga quando se afasta.
   */
  ativo?: boolean
  /** Id do elemento observado no modo da fase 1 (sem `ativo`). */
  ancora?: string
  /** A roda do mouse aproxima a imagem. Só faz sentido em tela cheia. */
  rolagemZoom?: boolean
  /** Mostra o botão "Mover o celular" (giroscópio) em telas de toque. */
  giroscopio?: boolean
}

export function Panorama360({
  panorama,
  imagemPlana,
  alt,
  yaw = 0,
  ativo: ativoProp,
  ancora,
  rolagemZoom = false,
  giroscopio = false,
}: Panorama360Props) {
  const raiz = useRef<HTMLDivElement>(null)
  const container = useRef<HTMLDivElement>(null)
  const falhou = useRef(false)
  const viewerRef = useRef<ViewerVivo | null>(null)
  const giroRef = useRef<GiroVivo | null>(null)
  const carregada = useRef('')
  // A cena atual e as opções são lidas na hora de criar o viewer, sem refazê-lo ao mudar.
  const cena = useRef({ panorama, yaw, rolagemZoom, giroscopio })
  useLayoutEffect(() => {
    cena.current = { panorama, yaw, rolagemZoom, giroscopio }
  })

  const controlado = ativoProp !== undefined
  const [visivel, setVisivel] = useState(false)
  const querAtivo = controlado ? ativoProp : visivel
  const [ativo, setAtivo] = useState(false)
  const [pronto, setPronto] = useState(false)
  const [indisponivel, setIndisponivel] = useState(false)
  const [dicaVisivel, setDicaVisivel] = useState(true)
  const [giroDisponivel, setGiroDisponivel] = useState(false)
  const [giroLigado, setGiroLigado] = useState(false)
  const textoDica = telaDeToque() ? 'Use dois dedos para olhar em volta' : 'Arraste para olhar em volta'

  // Modo da fase 1: liga quando o âncora chega a 200px da tela; desliga quando sai por inteiro
  // de uma folga de 1 tela. Assim só os viewers das áreas próximas ficam vivos.
  useEffect(() => {
    if (controlado) return
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
  }, [ancora, controlado])

  useEffect(() => {
    if (!querAtivo) {
      setAtivo(false)
      setPronto(false)
      setIndisponivel(false)
      return
    }
    if (falhou.current || !suportaWebGL()) {
      setIndisponivel(true)
      return
    }
    let cancelado = false
    let viewer: ViewerVivo | null = null
    const desistir = () => {
      falhou.current = true
      viewer?.destroy()
      viewer = null
      viewerRef.current = null
      giroRef.current = null
      setPronto(false)
      setAtivo(false)
      setIndisponivel(true)
    }

    setIndisponivel(false)
    setDicaVisivel(true)
    setGiroDisponivel(false)
    setGiroLigado(false)
    setAtivo(true)
    // o container só existe depois do render com ativo=true
    const iniciar = async () => {
      try {
        const comGiro = cena.current.giroscopio && telaDeToque()
        const [{ Viewer }, , modGiro] = await Promise.all([
          import('@photo-sphere-viewer/core'),
          import('@photo-sphere-viewer/core/index.css'),
          // O giroscópio é um extra: se o módulo falhar, o 360 segue sem ele.
          comGiro ? import('@photo-sphere-viewer/gyroscope-plugin').catch(() => null) : Promise.resolve(null),
        ])
        if (cancelado) return
        if (!container.current) return desistir()
        const atual = cena.current
        const v = new Viewer({
          container: container.current,
          panorama: atual.panorama,
          navbar: false,
          touchmoveTwoFingers: true,
          mousewheel: atual.rolagemZoom,
          lang: LANG_PT,
          defaultZoomLvl: 0,
          defaultYaw: `${atual.yaw}deg`,
          ...(modGiro ? { plugins: [modGiro.GyroscopePlugin] } : {}),
        }) as unknown as ViewerVivo & {
          addEventListener: (tipo: string, fn: () => void) => void
        }
        viewer = v
        viewerRef.current = v
        carregada.current = `${atual.panorama}|${atual.yaw}`
        v.addEventListener('panorama-error', () => {
          if (!cancelado) desistir()
        })
        // Memória de GPU esgotada em celular fraco: volta para a foto plana.
        container.current
          .querySelector('canvas')
          ?.addEventListener('webglcontextlost', () => {
            if (!cancelado) desistir()
          })
        if (modGiro && typeof v.getPlugin === 'function') {
          const g = v.getPlugin(modGiro.GyroscopePlugin)
          if (g) {
            giroRef.current = g
            g.addEventListener('gyroscope-updated', (e) => {
              if (!cancelado) setGiroLigado(e.gyroscopeEnabled)
            })
            void g.isSupported().then(
              (ok) => {
                if (!cancelado) setGiroDisponivel(ok)
              },
              () => {},
            )
          }
        }
        setPronto(true)
      } catch {
        if (!cancelado) desistir()
      }
    }
    void iniciar()
    return () => {
      cancelado = true
      viewer?.destroy()
      viewer = null
      viewerRef.current = null
      giroRef.current = null
    }
  }, [querAtivo])

  // Cena nova com o viewer vivo: troca o panorama sem recriar o viewer.
  useEffect(() => {
    const v = viewerRef.current
    const chave = `${panorama}|${yaw}`
    if (!pronto || !v?.setPanorama || carregada.current === chave) return
    carregada.current = chave
    v.setPanorama(panorama, {
      position: { yaw: `${yaw}deg`, pitch: 0 },
      transition: { speed: 1000, rotation: false },
    }).catch(() => {
      // troca interrompida por outra cena: a mais recente vence
    })
  }, [panorama, yaw, pronto])

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
          {giroDisponivel && (
            <button
              type="button"
              className="panorama__giro rotulo"
              aria-pressed={giroLigado}
              onClick={() => giroRef.current?.toggle()}
            >
              Mover o celular
            </button>
          )}
        </div>
      ) : (
        <>
          <ImagemComFallback className="panorama__img" src={imagemPlana} alt={alt} />
          {indisponivel && (
            <p className="panorama__aviso" role="status">
              A visão em 360° não está disponível neste aparelho. Mostrando a foto.
            </p>
          )}
        </>
      )}
    </div>
  )
}
