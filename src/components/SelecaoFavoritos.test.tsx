import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { areasDoNavio } from '../data/areas'
import { lugaresBuzios } from '../data/buzios'
import { SelecaoFavoritos } from './SelecaoFavoritos'

const todas = [...areasDoNavio, ...lugaresBuzios]

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

it('cada área é um botão de alternar', async () => {
  render(<SelecaoFavoritos areas={todas} />)
  const b = screen.getByRole('button', { name: areasDoNavio[0].nome })
  expect(b).toHaveAttribute('aria-pressed', 'false')
  await userEvent.click(b)
  expect(b).toHaveAttribute('aria-pressed', 'true')
})

it('separa em No navio e Em Búzios', () => {
  render(<SelecaoFavoritos areas={todas} />)
  expect(screen.getByRole('heading', { level: 2, name: 'Seus lugares favoritos' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 3, name: 'No navio' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 3, name: 'Em Búzios' })).toBeInTheDocument()
  expect(screen.getAllByRole('button', { pressed: false }).length).toBeGreaterThanOrEqual(todas.length)
})

it('mostra o contador', async () => {
  render(<SelecaoFavoritos areas={todas} />)
  expect(screen.getByText('Nenhum lugar escolhido')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: areasDoNavio[0].nome }))
  expect(screen.getByText('1 lugar escolhido')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: lugaresBuzios[0].nome }))
  expect(screen.getByText('2 lugares escolhidos')).toBeInTheDocument()
})

it('limpar desmarca tudo', async () => {
  render(<SelecaoFavoritos areas={todas} />)
  const b = screen.getByRole('button', { name: areasDoNavio[0].nome })
  await userEvent.click(b)
  await userEvent.click(screen.getByRole('button', { name: 'Limpar seleção' }))
  expect(b).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByText('Nenhum lugar escolhido')).toBeInTheDocument()
})

it('mostra o aviso de roteiro em breve', () => {
  render(<SelecaoFavoritos areas={todas} />)
  expect(screen.getByText('Em breve: um roteiro com esses lugares.')).toBeInTheDocument()
})
