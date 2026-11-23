import type { Area } from '../data/tipos'
import { CtaAcento } from './CtaAcento'
import { Creditos } from './Creditos'
import './Rodape.css'

interface RodapeProps {
  areas: Area[]
  /** Créditos de fotos que não pertencem a uma área (capas). */
  creditosExtras?: string[]
}

const LINKS = [
  { rotulo: 'Tour oficial da MSC', href: 'https://virtual-tours.msccruises.com/MSC-Divina/en-gb/index.html' },
  { rotulo: 'Búzios', href: 'https://pt.wikipedia.org/wiki/Arma%C3%A7%C3%A3o_dos_B%C3%BAzios' },
  { rotulo: 'Wikimedia Commons', href: 'https://commons.wikimedia.org' },
]

const ANO = new Date().getFullYear()

/** Créditos (seção clara, deduplicados) seguidos do rodapé preto. */
export function Rodape({ areas, creditosExtras = [] }: RodapeProps) {
  const creditos = [...areas.map((a) => a.credito), ...creditosExtras]

  return (
    <footer className="rodape">
      <Creditos creditos={creditos} />
      <div className="rodape__preto" data-tema="escuro">
        <div className="rodape__topo">
          <p className="rodape__marca">MSC Divina</p>
          <ul className="rodape__links">
            {LINKS.map((l) => (
              <li key={l.href}>
                <CtaAcento rotulo={l.rotulo} icone="seta-externa" href={l.href} externo />
              </li>
            ))}
          </ul>
        </div>
        <p className="rodape__assinatura rotulo">Feito pela família para a família · {ANO}</p>
      </div>
    </footer>
  )
}
