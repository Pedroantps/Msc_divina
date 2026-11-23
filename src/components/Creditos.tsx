import './Creditos.css'

interface CreditosProps {
  /** Créditos de foto. O componente deduplica e põe os da MSC primeiro, então quem chama pode passar a lista crua. */
  creditos: string[]
}

/** Deduplica (mantendo a ordem) e coloca os créditos da MSC na frente. */
function organizarCreditos(creditos: string[]): string[] {
  const unicos = [...new Set(creditos)]
  const ehMsc = (c: string) => /MSC/i.test(c)
  return [...unicos.filter(ehMsc), ...unicos.filter((c) => !ehMsc(c))]
}

export function Creditos({ creditos }: CreditosProps) {
  const lista = organizarCreditos(creditos)
  return (
    <section id="creditos" className="creditos" data-tema="claro" aria-labelledby="creditos-titulo">
      <h2 id="creditos-titulo" className="creditos__titulo">
        Fotos e créditos
      </h2>
      <ul className="creditos__lista">
        {lista.map((c) => (
          <li key={c} className="creditos__item">
            {c}
          </li>
        ))}
      </ul>
    </section>
  )
}
