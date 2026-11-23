import { capas } from '../data/capas'
import { Hero } from './Hero'

export default function VitrineHero() {
  return (
    <>
      <Hero imagem={capas.navio.imagem} alt={capas.navio.alt} alvo={{ x: 62, y: 48 }} />
      <section
        data-tema="escuro"
        style={{ minHeight: '150svh', padding: '4rem var(--margem)' }}
      >
        <p className="rotulo">Próxima seção</p>
      </section>
    </>
  )
}
