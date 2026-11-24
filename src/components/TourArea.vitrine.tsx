import { useRef, useState } from 'react'
import { areasDoNavio } from '../data/areas'
import { CtaAcento } from './CtaAcento'
import { TourArea } from './TourArea'

const spa = areasDoNavio.find((a) => a.id === 'aurea-spa')!

export default function VitrineTourArea() {
  const [aberto, setAberto] = useState(false)
  const cta = useRef<HTMLButtonElement | HTMLAnchorElement>(null)
  return (
    <section data-tema="escuro" style={{ display: 'grid', placeItems: 'center', minHeight: '100svh' }}>
      <CtaAcento ref={cta} rotulo="Ver em 360°" onClick={() => setAberto(true)} />
      <TourArea area={spa} aberto={aberto} aoFechar={() => setAberto(false)} retornoFoco={cta} />
    </section>
  )
}
