import { forwardRef, type MouseEventHandler, type Ref } from 'react'
import './CtaAcento.css'

type Icone = 'canto' | 'seta-baixo' | 'seta-externa' | 'mais' | 'check'

interface Base {
  rotulo: string
  /** Ícone dentro do quadrado de acento. Padrão: o canto (⌐) da referência. */
  icone?: Icone
  /** Esconde o rótulo visualmente (fica só o quadrado); o rótulo continua como nome acessível. */
  soQuadrado?: boolean
  className?: string
}

type ComoLink = Base & { href: string; externo?: boolean; onClick?: MouseEventHandler<HTMLAnchorElement> }
type ComoBotao = Base & { href?: undefined; onClick?: MouseEventHandler<HTMLButtonElement>; pressionado?: boolean }

export type CtaAcentoProps = ComoLink | ComoBotao

const CAMINHOS: Record<Icone, string> = {
  canto: 'M5 5h8v2H7v6H5z',
  'seta-baixo': 'M9 4h2v8.2l3.3-3.3 1.4 1.4L10 16 4.3 10.3l1.4-1.4L9 12.2z',
  'seta-externa': 'M7 5h8v8h-2V8.4l-6.3 6.3-1.4-1.4L11.6 7H7z',
  mais: 'M9 4h2v5h5v2h-5v5H9v-5H4V9h5z',
  check: 'M8.3 13.6 4.7 10l-1.4 1.4 5 5 9-9-1.4-1.4z',
}

/** Assinatura visual do site: quadrado de acento com ícone + rótulo em caixa alta. */
export const CtaAcento = forwardRef<HTMLAnchorElement | HTMLButtonElement, CtaAcentoProps>(function CtaAcento(props, ref) {
  const { rotulo, icone = 'canto', soQuadrado, className } = props
  const classes = ['cta', soQuadrado ? 'cta--so-quadrado' : '', className ?? ''].filter(Boolean).join(' ')
  const conteudo = (
    <>
      <span className="cta__quadrado" aria-hidden="true">
        <svg viewBox="0 0 20 20" width="14" height="14" focusable="false">
          <path d={CAMINHOS[icone]} fill="currentColor" />
        </svg>
      </span>
      <span className={soQuadrado ? 'cta__rotulo visualmente-oculto' : 'cta__rotulo rotulo'}>{rotulo}</span>
    </>
  )

  if (props.href !== undefined) {
    const { href, externo, onClick } = props
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        className={classes}
        href={href}
        onClick={onClick}
        {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {conteudo}
      </a>
    )
  }
  const { onClick, pressionado } = props
  return (
    <button ref={ref as Ref<HTMLButtonElement>} type="button" className={classes} onClick={onClick} aria-pressed={pressionado}>
      {conteudo}
    </button>
  )
})
