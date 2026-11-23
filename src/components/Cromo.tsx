import { useCallback, useEffect, useState } from 'react'
import { CtaAcento } from './CtaAcento'
import { useReducedMotion } from '../hooks/useReducedMotion'
import './Cromo.css'

interface Props {
  /** id do elemento onde o primeiro capítulo começa. */
  ancoraInicial?: string
}

const LIMITE_ROLAGEM = 0.1
const PONTO_LOGO_Y = 32

/** Tema da seção que está sob o logo (ponto fixo no topo esquerdo). Padrão: escuro (logo claro). */
function temaSobLogo(): 'claro' | 'escuro' {
  const secoes = document.querySelectorAll<HTMLElement>('section[data-tema]')
  for (const secao of secoes) {
    const r = secao.getBoundingClientRect()
    if (r.top <= PONTO_LOGO_Y && r.bottom > PONTO_LOGO_Y) return secao.dataset.tema === 'claro' ? 'claro' : 'escuro'
  }
  return 'escuro'
}

/** Elementos fixos sobre a página: logo no topo esquerdo e indicador "Role para embarcar". */
export function Cromo({ ancoraInicial = 'capitulo-navio' }: Props) {
  const reduzido = useReducedMotion()
  const [temaFundo, setTemaFundo] = useState<'claro' | 'escuro'>('escuro')
  const [rolou, setRolou] = useState(false)

  useEffect(() => {
    const atualizar = () => {
      setTemaFundo(temaSobLogo())
      setRolou(window.scrollY > window.innerHeight * LIMITE_ROLAGEM)
    }
    atualizar()
    // Agrupa os eventos de rolagem em um único cálculo por quadro.
    let quadro = 0
    const agendar = () => {
      if (quadro) return
      quadro = requestAnimationFrame(() => {
        quadro = 0
        atualizar()
      })
    }
    window.addEventListener('scroll', agendar, { passive: true })
    window.addEventListener('resize', agendar)
    return () => {
      if (quadro) cancelAnimationFrame(quadro)
      window.removeEventListener('scroll', agendar)
      window.removeEventListener('resize', agendar)
    }
  }, [])

  const embarcar = useCallback(() => {
    document.getElementById(ancoraInicial)?.scrollIntoView({ behavior: reduzido ? 'auto' : 'smooth', block: 'start' })
  }, [ancoraInicial, reduzido])

  // O logo é claro sobre fundo escuro e escuro sobre fundo claro.
  const corLogo = temaFundo === 'escuro' ? 'claro' : 'escuro'

  return (
    <div className="cromo">
      <div className="cromo__logo" data-tema-logo={corLogo}>
        <span>MSC Divina</span>
      </div>
      <div className={`cromo__rolar${rolou ? ' cromo__rolar--oculto' : ''}`} aria-hidden={rolou || undefined}>
        <CtaAcento rotulo="Role para embarcar" icone="seta-baixo" onClick={embarcar} />
      </div>
    </div>
  )
}
