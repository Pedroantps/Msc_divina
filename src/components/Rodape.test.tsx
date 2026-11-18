import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { areasDoNavio } from '../data/areas'
import { lugaresBuzios } from '../data/buzios'
import type { Area } from '../data/tipos'
import { Rodape } from './Rodape'

const todas = [...areasDoNavio, ...lugaresBuzios]

it('lista cada crédito uma única vez', () => {
  render(<Rodape areas={todas} />)
  const unicos = [...new Set(todas.map((a) => a.credito))]
  expect(screen.getAllByRole('listitem')).toHaveLength(unicos.length)
  for (const c of unicos) expect(screen.getAllByText(c, { exact: false }).length).toBeGreaterThan(0)
})

it('não repete créditos iguais', () => {
  const base = todas[0] as Area
  const areas: Area[] = [base, { ...base, id: 'outra' }]
  render(<Rodape areas={areas} />)
  expect(screen.getAllByRole('listitem')).toHaveLength(1)
})

it('inclui os créditos extras das capas sem duplicar', () => {
  const base = todas[0] as Area
  render(<Rodape areas={[base]} creditosExtras={['Foto: Capa', base.credito]} />)
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  expect(screen.getByText('Foto: Capa')).toBeInTheDocument()
})

it('linka o tour oficial da MSC em nova aba', () => {
  render(<Rodape areas={todas} />)
  const link = screen.getByRole('link', { name: 'Tour virtual oficial da MSC' })
  expect(link).toHaveAttribute('href', 'https://virtual-tours.msccruises.com/')
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
})

it('usa o elemento footer', () => {
  render(<Rodape areas={todas} />)
  expect(screen.getByRole('contentinfo')).toBeInTheDocument()
})
