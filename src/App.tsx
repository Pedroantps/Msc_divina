import { Cromo } from './components/Cromo'
import { NavCapitulos } from './components/NavCapitulos'
import { Hero } from './components/Hero'
import { Percurso } from './components/Percurso'
import { Buzios } from './components/Buzios'
import { SelecaoFavoritos } from './components/SelecaoFavoritos'
import { Rodape } from './components/Rodape'
import { areasDoNavio } from './data/areas'
import { lugaresBuzios } from './data/buzios'
import { capas } from './data/capas'
import { capitulos } from './data/capitulos'

const todas = [...areasDoNavio, ...lugaresBuzios]

export default function App() {
  return (
    <>
      <main>
        <Hero imagem={capas.navio.imagem} alt={capas.navio.alt} alvo={{ x: 62, y: 48 }} />
        <Percurso areas={areasDoNavio} id="capitulo-navio" />
        <Buzios lugares={lugaresBuzios} capa={capas.buzios} id="capitulo-buzios" />
        <SelecaoFavoritos areas={todas} />
      </main>
      <Rodape areas={todas} creditosExtras={[capas.navio.credito, capas.buzios.credito]} />
      {/* Cromo fixo depois do conteúdo: as âncoras dos capítulos já existem quando ele monta. */}
      <Cromo ancoraInicial="capitulo-navio" />
      <NavCapitulos capitulos={capitulos} areas={areasDoNavio} />
    </>
  )
}
