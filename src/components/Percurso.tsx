import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollTrigger, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useCapacidade3D } from '../hooks/useCapacidade3D'
import { estadoNaRolagem } from '../lib/camera/coreografia'
import { panoramaPara } from '../lib/imagens'
import { rolarParaPosicao } from '../lib/rolagem'
import type { ControlePalco, EstadoCamera, RoteiroArea } from '../lib/camera/tipos'
import { roteiros as roteirosPadrao } from '../data/roteiro'
import type { Area } from '../data/tipos'
import { CtaAcento } from './CtaAcento'
import { ImagemComFallback } from './ImagemComFallback'
import { PalcoFotos } from './PalcoFotos'
import { PalcoPanorama } from './PalcoPanorama'
import { TourArea } from './TourArea'
import './Percurso.css'

interface PercursoProps {
  areas: Area[]
  /** Âncora do capítulo (a barra de capítulos aponta para ela). */
  id?: string
  /** Roteiros de câmera, um por área (os testes injetam os seus). */
  roteiros?: RoteiroArea[]
}

const POSICOES = ['esquerda', 'centro', 'direita'] as const

/** Faixa de progresso da parada em que o texto fica na tela. */
const TEXTO_DE = 0.15
const TEXTO_ATE = 0.7

/** Parada cujo texto deve aparecer no progresso global, ou null entre textos. */
function paradaAtiva(progresso: number, total: number): number | null {
  const i = Math.min(Math.floor(progresso), total - 1)
  const p = progresso - i
  return p >= TEXTO_DE && p < TEXTO_ATE ? i : null
}

export function Percurso({ areas, id = 'capitulo-navio', roteiros = roteirosPadrao }: PercursoProps) {
  const raiz = useRef<HTMLElement>(null)
  const paradasRef = useRef<HTMLDivElement>(null)
  const palco = useRef<ControlePalco>(null)
  const ultimoEstado = useRef<EstadoCamera | null>(null)
  const ativaRef = useRef<number | null>(null)
  const origemFoco = useRef<HTMLElement | null>(null)
  const reduzido = useReducedMotion()
  const capacidade = useCapacidade3D()
  // O palco só monta com o capítulo a ≤ 1 tela de distância (sem IntersectionObserver, monta logo).
  const [perto, setPerto] = useState(() => typeof IntersectionObserver === 'undefined')
  const [falhou, setFalhou] = useState(false)
  const [ativa, setAtiva] = useState<number | null>(null)
  const [tour, setTour] = useState<{ id: string; aberto: boolean }>({ id: areas[0]?.id ?? '', aberto: false })

  const usaPanorama = capacidade !== 'sem3d' && !falhou
  const dpr = Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, capacidade === 'alta' ? 2 : 1.5)
  const aoFalhar = useCallback(() => setFalhou(true), [])

  useEffect(() => {
    const el = raiz.current
    if (reduzido || !el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return
        setPerto(true)
        obs.disconnect()
      },
      { rootMargin: '100% 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [reduzido])

  // Palco recém-montado (ou trocado para fotos) recebe o último estado conhecido.
  useEffect(() => {
    if (reduzido || !perto) return
    palco.current?.definirEstado(ultimoEstado.current ?? estadoNaRolagem(0, roteiros))
  }, [reduzido, perto, usaPanorama, roteiros])

  useGSAP(
    () => {
      const alvo = paradasRef.current
      if (reduzido || !alvo) return
      const total = areas.length
      ScrollTrigger.create({
        trigger: alvo,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (s) => {
          const progresso = s.progress * total
          const estado = estadoNaRolagem(progresso, roteiros)
          ultimoEstado.current = estado
          palco.current?.definirEstado(estado)
          const nova = paradaAtiva(progresso, total)
          if (nova !== ativaRef.current) {
            ativaRef.current = nova
            setAtiva(nova)
          }
        },
      })
      return () => {
        ativaRef.current = null
      }
    },
    { scope: raiz, dependencies: [reduzido, areas.length, roteiros], revertOnUpdate: true },
  )

  const abrir = (areaId: string, origem: HTMLElement) => {
    origemFoco.current = origem
    setTour({ id: areaId, aberto: true })
  }

  // Foco por teclado numa parada inativa: rola até p≈0,4 dela (onde o texto aparece) e ativa o texto já.
  const aoFocar = (areaId: string, indice: number) => {
    if (reduzido || ativaRef.current === indice) return
    const secao = document.getElementById(areaId)
    if (!secao) return
    const caixa = secao.getBoundingClientRect()
    rolarParaPosicao(caixa.top + window.scrollY + 0.4 * caixa.height)
    ativaRef.current = indice
    setAtiva(indice)
  }

  const areaDoTour = areas.find((a) => a.id === tour.id)

  return (
    <section
      ref={raiz}
      id={id}
      className="percurso"
      data-tema="escuro"
      data-estatico={reduzido ? 'true' : undefined}
      aria-label="O navio"
    >
      {!reduzido && (
        <div className="percurso__palco" aria-hidden="true">
          {perto &&
            (usaPanorama ? (
              <PalcoPanorama
                ref={palco}
                panoramas={areas.map((a) => panoramaPara(a.panorama!, capacidade))}
                posteres={areas.map((a) => a.imagem)}
                dpr={dpr}
                aoFalhar={aoFalhar}
              />
            ) : (
              <PalcoFotos ref={palco} imagens={areas.map((a) => a.imagem)} />
            ))}
          <div
            className="percurso__veu"
            data-posicao={ativa !== null ? POSICOES[ativa % POSICOES.length] : undefined}
          />
        </div>
      )}

      <div ref={paradasRef} className={reduzido ? 'percurso__lista' : 'percurso__paradas'}>
        {areas.map((area, i) => (
          <Parada
            key={area.id}
            area={area}
            indice={i}
            estatica={reduzido}
            ativa={ativa === i}
            aoAbrir={abrir}
            aoFocar={aoFocar}
          />
        ))}
      </div>

      {areaDoTour && (
        <TourArea
          area={areaDoTour}
          aberto={tour.aberto}
          aoFechar={() => setTour((t) => ({ ...t, aberto: false }))}
          retornoFoco={origemFoco}
        />
      )}
    </section>
  )
}

interface ParadaProps {
  area: Area
  indice: number
  estatica: boolean
  ativa: boolean
  aoAbrir: (areaId: string, origem: HTMLElement) => void
  aoFocar: (areaId: string, indice: number) => void
}

function Parada({ area, indice, estatica, ativa, aoAbrir, aoFocar }: ParadaProps) {
  const tituloId = `${area.id}-titulo`
  const ambientes = area.cenas?.length ?? 0
  const titulo = area.titulo ?? area.nome
  return (
    <section
      id={area.id}
      className="parada"
      data-indice={indice}
      aria-labelledby={tituloId}
      onFocusCapture={() => aoFocar(area.id, indice)}
    >
      {estatica && (
        <div className="parada__foto">
          <ImagemComFallback className="parada__img" src={area.imagem} alt={area.nome} />
        </div>
      )}
      <div
        className="parada__texto"
        data-posicao={POSICOES[indice % POSICOES.length]}
        data-ativa={ativa ? 'true' : undefined}
      >
        <h2 id={tituloId} className="parada__titulo">
          {titulo}
        </h2>
        <p className="parada__meta rotulo">
          {area.nome}
          {area.deck !== undefined && ` · Deck ${area.deck}`}
        </p>
        {ambientes > 1 && <p className="parada__meta rotulo">{ambientes} ambientes em 360°</p>}
        <p className={estatica ? 'parada__descricao' : 'parada__descricao visualmente-oculto'}>{area.descricao}</p>
        <CtaAcento
          className="parada__cta"
          rotulo="Ver em 360°"
          onClick={(e) => aoAbrir(area.id, e.currentTarget)}
        />
      </div>
    </section>
  )
}
