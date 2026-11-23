import { areasDoNavio } from '../data/areas'
import { lugaresBuzios } from '../data/buzios'
import { calcularNumeros } from '../data/numeros'
import { Numeros } from './Numeros'

export default function VitrineNumeros() {
  return (
    <section data-tema="claro" style={{ minHeight: '100svh', display: 'grid', alignContent: 'center', padding: 'var(--margem)' }}>
      <Numeros itens={calcularNumeros(areasDoNavio, lugaresBuzios)} />
    </section>
  )
}
