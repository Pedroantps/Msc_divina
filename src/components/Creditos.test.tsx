import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Creditos } from './Creditos'

it('tem o título e a seção clara', () => {
  render(<Creditos creditos={['A']} />)
  expect(screen.getByRole('heading', { level: 2, name: 'Fotos e créditos' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Fotos e créditos' })).toHaveAttribute('data-tema', 'claro')
})

it('deduplica e põe o crédito da MSC primeiro', () => {
  render(
    <Creditos
      creditos={['Foto: Fulano, Wikimedia', 'Imagem: MSC Cruzeiros, tour', 'Foto: Fulano, Wikimedia', 'Imagem: MSC Cruzeiros, tour']}
    />,
  )
  const itens = screen.getAllByRole('listitem').map((li) => li.textContent)
  expect(itens).toEqual(['Imagem: MSC Cruzeiros, tour', 'Foto: Fulano, Wikimedia'])
})
