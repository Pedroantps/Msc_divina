import { useMemo } from 'react'
import type { Area } from '../data/tipos'
import { useFavoritos } from '../hooks/useFavoritos'
import { ImagemComFallback } from './ImagemComFallback'
import './SelecaoFavoritos.css'

interface SelecaoFavoritosProps {
  areas: Area[]
}

function textoContador(n: number) {
  if (n === 0) return 'Nenhum lugar escolhido'
  return n === 1 ? '1 lugar escolhido' : `${n} lugares escolhidos`
}

export function SelecaoFavoritos({ areas }: SelecaoFavoritosProps) {
  const ids = useMemo(() => areas.map((a) => a.id), [areas])
  const { selecionados, alternar, limpar } = useFavoritos(ids)

  const grupo = (titulo: string, itens: Area[]) =>
    itens.length > 0 && (
      <div className="favoritos__grupo">
        <h3 className="favoritos__subtitulo">{titulo}</h3>
        <ul className="favoritos__grade">
          {itens.map((a) => {
            const marcado = selecionados.includes(a.id)
            return (
              <li key={a.id}>
                <button
                  type="button"
                  className="favoritos__item"
                  aria-pressed={marcado}
                  onClick={() => alternar(a.id)}
                >
                  <span className="favoritos__miniatura" aria-hidden="true">
                    <ImagemComFallback src={a.imagem} alt={a.nome} />
                  </span>
                  <span className="favoritos__nome">{a.nome}</span>
                  {marcado && (
                    <span className="favoritos__selo" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    )

  return (
    <section className="favoritos" aria-labelledby="favoritos-titulo">
      <h2 id="favoritos-titulo" className="favoritos__titulo">
        Seus lugares favoritos
      </h2>
      {grupo('No navio', areas.filter((a) => a.categoria === 'navio'))}
      {grupo('Em Búzios', areas.filter((a) => a.categoria === 'buzios'))}
      <p className="favoritos__aviso">Em breve: um roteiro com esses lugares.</p>
      <div className="favoritos__rodape">
        <p className="favoritos__contador" aria-live="polite">
          {textoContador(selecionados.length)}
        </p>
        <button type="button" className="favoritos__limpar" onClick={limpar} disabled={selecionados.length === 0}>
          Limpar seleção
        </button>
      </div>
    </section>
  )
}
