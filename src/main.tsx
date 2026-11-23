import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/unbounded/wght.css'
import '@fontsource-variable/inter-tight/wght.css'
import './styles/tokens.css'
import './styles/global.css'
import App from './App'
import { Vitrine } from './dev/Vitrine'

// Só em desenvolvimento: ?secao=<id> mostra uma seção sozinha (ver src/dev/Vitrine.tsx).
const secao = import.meta.env.DEV ? new URLSearchParams(location.search).get('secao') : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {secao !== null ? <Vitrine secao={secao} /> : <App />}
  </StrictMode>,
)
