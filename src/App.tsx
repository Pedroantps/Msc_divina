import { Hero } from './components/Hero'
import { AreasDoNavio } from './components/AreasDoNavio'
import { areasDoNavio } from './data/areas'

export default function App() {
  return (
    <main>
      <Hero imagem="/img/divina-externa.webp" alvo={{ x: 62, y: 48 }} />
      <AreasDoNavio areas={areasDoNavio} />
    </main>
  )
}
