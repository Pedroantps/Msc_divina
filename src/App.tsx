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
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      {/* Cromo e barra de capítulos vêm antes do conteúdo na ordem de tabulação. As âncoras
          dos capítulos são resolvidas depois do mount (layout effect), quando o <main> já existe. */}
      <Cromo ancoraInicial="capitulo-navio" />
      <NavCapitulos capitulos={capitulos} areas={areasDoNavio} />
      <main id="conteudo" tabIndex={-1}>
        <Hero imagem={capas.navio.imagem} alt={capas.navio.alt} alvo={{ x: 62, y: 48 }} />
        <Percurso areas={areasDoNavio} id="capitulo-navio" />
        <Buzios lugares={lugaresBuzios} capa={capas.buzios} id="capitulo-buzios" />
        <SelecaoFavoritos areas={todas} />
      </main>
      <Rodape areas={todas} creditosExtras={[capas.navio.credito, capas.buzios.credito]} />
    </>
  )
}
