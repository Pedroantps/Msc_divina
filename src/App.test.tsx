import { render, screen } from '@testing-library/react'
import App from './App'
import { capas } from './data/capas'

it('mostra o título do navio', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: 'MSC Divina' })).toBeInTheDocument()
})

it('o rodapé fica fora do main e credita as capas', () => {
  render(<App />)
  const rodape = screen.getByRole('contentinfo')
  expect(screen.getByRole('main')).not.toContainElement(rodape)
  expect(rodape).toHaveTextContent(capas.navio.credito)
  expect(capas.buzios.imagem).toBe('/img/buzios-panorama-geral.webp')
})
