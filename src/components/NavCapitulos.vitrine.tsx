import { NavCapitulos } from './NavCapitulos'
import { capitulos } from '../data/capitulos'
import { areasDoNavio } from '../data/areas'

const alta = { minHeight: '250vh', padding: '6rem 3rem' } as const

export default function VitrineNavCapitulos() {
  return (
    <>
      <NavCapitulos capitulos={capitulos} areas={areasDoNavio} />
      <section id="capitulo-navio" data-tema="escuro" style={alta}>
        <p>Capítulo do navio (escuro).</p>
        {areasDoNavio.map((a) => (
          <h2 key={a.id} id={a.id} style={{ marginTop: '12vh' }}>{a.nome}</h2>
        ))}
      </section>
      <section id="capitulo-buzios" data-tema="claro" style={alta}>
        <p>Capítulo de Búzios (claro).</p>
      </section>
    </>
  )
}
