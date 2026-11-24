import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/unbounded/wght.css'
import '@fontsource-variable/inter-tight/wght.css'
import unboundedLatin from '@fontsource-variable/unbounded/files/unbounded-latin-wght-normal.woff2?url'
import interTightLatin from '@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2?url'
import './styles/tokens.css'
import './styles/global.css'
import App from './App'

// Pré-carrega as fontes latin usadas no Hero para evitar a troca visível de fonte.
for (const href of [unboundedLatin, interTightLatin]) {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'font'
  link.type = 'font/woff2'
  link.crossOrigin = 'anonymous'
  link.href = href
  document.head.appendChild(link)
}

const raiz = createRoot(document.getElementById('root')!)

// Só em desenvolvimento: ?secao=<id> mostra uma seção sozinha (ver src/dev/Vitrine.tsx).
// O import dinâmico mantém a vitrine fora do bundle de produção.
const secao = import.meta.env.DEV ? new URLSearchParams(location.search).get('secao') : null

if (import.meta.env.DEV && secao) {
  void import('./dev/Vitrine').then(({ Vitrine }) => {
    raiz.render(
      <StrictMode>
        <Vitrine secao={secao} />
      </StrictMode>,
    )
  })
} else {
  raiz.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
