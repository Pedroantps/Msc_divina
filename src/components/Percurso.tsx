import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'
import type { Area } from '../data/tipos'
import { CtaAcento } from './CtaAcento'
import { ImagemComFallback } from './ImagemComFallback'
import { TourArea } from './TourArea'
import './Percurso.css'

interface PercursoProps {
  areas: Area[]
  /** Âncora do capítulo (a barra de capítulos aponta para ela). */
  id?: string
}

const POSICOES = ['esquerda', 'centro', 'direita'] as const

/** Altura de cada parada, em telas (150svh). */
const ALTURA_PARADA = 1.5
/** Quanto do trecho de uma parada o fade entre camadas ocupa. */
const FADE = 0.15

export function Percurso({ areas, id = 'capitulo-navio' }: PercursoProps) {
  const raiz = useRef<HTMLElement>(null)
  const origemFoco = useRef<HTMLElement | null>(null)
  const reduzido = useReducedMotion()
  // Sem IntersectionObserver todas as faixas montam logo; com ele, só as paradas perto da tela.
  const [carregadas, setCarregadas] = useState<ReadonlySet<number>>(
    () => new Set(typeof IntersectionObserver === 'undefined' ? areas.map((_, i) => i) : []),
  )
  const [ativa, setAtiva] = useState<number | null>(null)
  const [tour, setTour] = useState<{ id: string; aberto: boolean }>({ id: areas[0]?.id ?? '', aberto: false })

  // Monta a faixa de uma parada quando ela está a ~2,5 telas de distância.
  useEffect(() => {
    const el = raiz.current
    if (reduzido || !el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      (entradas) => {
        const novas = entradas
          .filter((e) => e.isIntersecting)
          .map((e) => Number((e.target as HTMLElement).dataset.indice))
        if (novas.length === 0) return
        setCarregadas((atual) => (novas.every((i) => atual.has(i)) ? atual : new Set([...atual, ...novas])))
        for (const e of entradas) if (e.isIntersecting) obs.unobserve(e.target)
      },
      { rootMargin: '250% 0px' },
    )
    el.querySelectorAll('.parada').forEach((s) => obs.observe(s))
    return () => obs.disconnect()
  }, [reduzido, areas.length])

  // Parada ativa: a faixa dela e a da seguinte já contam como carregadas (a próxima não aparece vazia no fade).
  const montada = (i: number) =>
    carregadas.has(i) || (ativa !== null && typeof IntersectionObserver !== 'undefined' && (i === ativa || i === ativa + 1))

  useGSAP(
    () => {
      if (reduzido) return
      const secoes = gsap.utils.toArray<HTMLElement>('.parada')
      const camadas = gsap.utils.toArray<HTMLElement>('.percurso__camada')
      const giros = gsap.utils.toArray<HTMLElement>('.percurso__giro')

      const ultima = secoes.length - 1

      secoes.forEach((secao, i) => {
        // O palco sticky solta quando o fim da última parada chega ao fim da tela: o giro e o
        // texto dela terminam aí ('bottom bottom'), não 100svh depois.
        const fim = i === ultima ? 'bottom bottom' : 'bottom top'
        const giro = giros[i]
        const camada = camadas[i]
        if (!giro || !camada) return

        // Giro de câmera: a rolagem da parada desliza a faixa de ponta a ponta com leve zoom.
        gsap.fromTo(
          giro,
          { x: 0, scale: 1, transformOrigin: '50% 50%' },
          {
            x: () => -Math.max(0, giro.offsetWidth - camada.clientWidth),
            scale: 1.08,
            ease: 'none',
            scrollTrigger: {
              trigger: secao,
              start: 'top top',
              end: fim,
              scrub: true,
              invalidateOnRefresh: true,
              onToggle: (self) => {
                giro.style.willChange = self.isActive ? 'transform' : ''
              },
            },
          },
        )

        // Texto: aparece quando a imagem da parada já chegou e sai antes do fade da próxima.
        ScrollTrigger.create({
          trigger: secao,
          start: 'top 10%',
          end: i === ultima ? 'bottom bottom' : 'bottom 30%',
          onToggle: (self) => {
            if (self.isActive) setAtiva(i)
            else setAtiva((atual) => (atual === i ? null : atual))
          },
        })

        if (i === 0) return
        // Fade curto da camada nova por cima da anterior (≈15% do trecho). A anterior sai da
        // composição depois, para não manter 14 imagens grandes empilhadas na GPU. Isso é feito
        // por classe no giro (visibility), sem tocar no autoAlpha que o fade da própria camada controla.
        const giroAnterior = giros[i - 1]
        const ocultar = (oculto: boolean) => giroAnterior?.classList.toggle('percurso__giro--oculto', oculto)
        gsap.fromTo(
          camada,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: secao,
              start: `top ${FADE * ALTURA_PARADA * 100}%`,
              end: 'top top',
              scrub: true,
              onLeave: () => ocultar(true),
              onEnterBack: () => ocultar(false),
              onRefresh: (self) => ocultar(self.progress >= 1),
            },
          },
        )
      })

      return () => giros.forEach((g) => g.classList.remove('percurso__giro--oculto'))
    },
    { scope: raiz, dependencies: [reduzido, areas.length], revertOnUpdate: true },
  )

  const abrir = (areaId: string, origem: HTMLElement) => {
    origemFoco.current = origem
    setTour({ id: areaId, aberto: true })
  }

  // Foco por teclado numa parada que não está na tela: leva a rolagem até ela.
  const aoFocar = (areaId: string, indice: number) => {
    if (!reduzido && ativa !== indice) document.getElementById(areaId)?.scrollIntoView?.()
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
          {areas.map((area, i) => (
            <div key={area.id} className="percurso__camada">
              <div className="percurso__giro">
                {montada(i) && area.faixa && (
                  <ImagemComFallback
                    className="percurso__faixa"
                    src={area.faixa}
                    alt=""
                    loading="eager"
                    fetchpriority={i === 0 ? 'high' : undefined}
                  />
                )}
              </div>
            </div>
          ))}
          <div
            className="percurso__veu"
            data-posicao={ativa !== null ? POSICOES[ativa % POSICOES.length] : undefined}
          />
        </div>
      )}

      <div className={reduzido ? 'percurso__lista' : 'percurso__paradas'}>
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
