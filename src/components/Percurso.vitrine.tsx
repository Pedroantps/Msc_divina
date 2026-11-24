import { areasDoNavio } from '../data/areas'
import { Percurso } from './Percurso'

export default function VitrinePercurso() {
  return (
    <>
      <Percurso areas={areasDoNavio} />
      <section
        data-tema="claro"
        style={{ display: 'grid', placeItems: 'center', minHeight: '100svh', padding: '3rem' }}
      >
        <p className="rotulo">Fim do percurso</p>
      </section>
    </>
  )
}
