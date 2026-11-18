import { render, screen } from '@testing-library/react'
import App from './App'

it('mostra o título do navio', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: 'MSC Divina' })).toBeInTheDocument()
})
