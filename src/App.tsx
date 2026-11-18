import { Hero } from './components/Hero'
import { AreasDoNavio } from './components/AreasDoNavio'
import { Panorama360 } from './components/Panorama360'
import { Buzios } from './components/Buzios'
import { SelecaoFavoritos } from './components/SelecaoFavoritos'
import { Rodape } from './components/Rodape'
import { areasDoNavio } from './data/areas'
import { lugaresBuzios } from './data/buzios'

export default function App() {
  return (
    <main>
      <Hero imagem="/img/divina-externa.webp" alvo={{ x: 62, y: 48 }} />
      <AreasDoNavio
        aposHero
        areas={areasDoNavio}
        renderMidia={(a) =>
          a.panorama ? <Panorama360 panorama={a.panorama} imagemPlana={a.imagem} alt={a.nome} ancora={a.id} /> : undefined
        }
      />
      <Buzios lugares={lugaresBuzios} />
      <SelecaoFavoritos areas={[...areasDoNavio, ...lugaresBuzios]} />
      <Rodape areas={[...areasDoNavio, ...lugaresBuzios]} />
    </main>
  )
}
