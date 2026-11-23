import type { ComponentType } from 'react'

/**
 * Vitrine de desenvolvimento: http://localhost:5173/?secao=<id> mostra uma seção sozinha.
 * Cada componente registra a sua num arquivo próprio `src/components/<Nome>.vitrine.tsx`
 * com um único `export default` (o id é o nome do arquivo em minúsculas: Hero → ?secao=hero).
 * Assim nenhum agente precisa editar este arquivo.
 */
const modulos = import.meta.glob<{ default: ComponentType }>('../components/*.vitrine.tsx', { eager: true })
const secoes: Record<string, ComponentType> = Object.fromEntries(
  Object.entries(modulos).map(([caminho, m]) => [caminho.split('/').pop()!.replace('.vitrine.tsx', '').toLowerCase(), m.default]),
)

export function Vitrine({ secao }: { secao: string }) {
  const Secao = secoes[secao]
  if (!Secao) {
    return (
      <main style={{ padding: '2rem' }}>
        <p>Seção “{secao}” não encontrada. Disponíveis:</p>
        <ul>
          {Object.keys(secoes).map((id) => (
            <li key={id}>
              <a href={`?secao=${id}`} style={{ color: 'inherit' }}>{id}</a>
            </li>
          ))}
        </ul>
      </main>
    )
  }
  return <Secao />
}
