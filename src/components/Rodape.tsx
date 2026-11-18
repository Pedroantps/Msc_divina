import type { Area } from '../data/tipos'
import './Rodape.css'

interface RodapeProps {
  areas: Area[]
}

export function Rodape({ areas }: RodapeProps) {
  const creditos = [...new Set(areas.map((a) => a.credito))]

  return (
    <footer className="rodape">
      <h2 className="rodape__titulo">Créditos</h2>
      <ul className="rodape__lista">
        {creditos.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <p className="rodape__tour">
        <a href="https://virtual-tours.msccruises.com/" target="_blank" rel="noopener noreferrer">
          Tour virtual oficial da MSC
        </a>
      </p>
    </footer>
  )
}
