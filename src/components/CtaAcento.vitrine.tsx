import { CtaAcento } from './CtaAcento'

export default function VitrineCta() {
  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <section data-tema="escuro" style={{ display: 'grid', gap: '1.5rem', padding: '3rem' }}>
        <CtaAcento rotulo="Ver em 360°" />
        <CtaAcento rotulo="Role para embarcar" icone="seta-baixo" />
        <CtaAcento rotulo="Tour oficial da MSC" icone="seta-externa" href="#" />
      </section>
      <section data-tema="claro" style={{ display: 'grid', gap: '1.5rem', padding: '3rem' }}>
        <CtaAcento rotulo="Favoritar" icone="mais" pressionado={false} />
        <CtaAcento rotulo="Favorito" icone="check" pressionado />
      </section>
    </div>
  )
}
