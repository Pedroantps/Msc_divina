import { Hero } from './components/Hero'
import { AreasDoNavio } from './components/AreasDoNavio'
import { Panorama360 } from './components/Panorama360'
import { areasDoNavio } from './data/areas'

export default function App() {
  return (
    <main>
      <Hero imagem="/img/divina-externa.webp" alvo={{ x: 62, y: 48 }} />
      <AreasDoNavio
        areas={areasDoNavio}
        renderMidia={(a) =>
          a.panorama ? <Panorama360 panorama={a.panorama} imagemPlana={a.imagem} alt={a.nome} /> : undefined
        }
      />
    </main>
  )
}
