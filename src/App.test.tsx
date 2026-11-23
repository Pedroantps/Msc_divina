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

it('tem link para pular ao conteúdo e a barra de capítulos vem antes do main', () => {
  render(<App />)
  const link = screen.getByRole('link', { name: 'Pular para o conteúdo' })
  expect(link).toHaveAttribute('href', '#conteudo')
  const main = screen.getByRole('main')
  expect(main).toHaveAttribute('id', 'conteudo')
  const nav = screen.getByRole('navigation', { name: 'Capítulos' })
  expect(link.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(nav.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

it('a barra de capítulos acha as âncoras mesmo montando antes do conteúdo', () => {
  render(<App />)
  expect(document.getElementById('capitulo-navio')).toBeInTheDocument()
  expect(document.getElementById('capitulo-buzios')).toBeInTheDocument()
})
