import { Cromo } from './Cromo'

const alta = { minHeight: '180vh', padding: '6rem 3rem' } as const

export default function VitrineCromo() {
  return (
    <>
      <Cromo />
      <section id="capitulo-navio" data-tema="escuro" style={alta}>
        <p>Capítulo do navio (escuro). Role para ver o logo trocar de cor.</p>
      </section>
      <section id="capitulo-buzios" data-tema="claro" style={alta}>
        <p>Capítulo de Búzios (claro).</p>
      </section>
    </>
  )
}
