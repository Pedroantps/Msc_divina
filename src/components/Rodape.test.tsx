import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { areasDoNavio } from '../data/areas'
import { lugaresBuzios } from '../data/buzios'
import type { Area } from '../data/tipos'
import { Rodape } from './Rodape'

const todas = [...areasDoNavio, ...lugaresBuzios]
const creditosDe = () => within(screen.getByRole('region', { name: 'Fotos e créditos' }))

it('lista cada crédito uma única vez', () => {
  render(<Rodape areas={todas} />)
  const unicos = [...new Set(todas.map((a) => a.credito))]
  expect(creditosDe().getAllByRole('listitem')).toHaveLength(unicos.length)
})

it('não repete créditos iguais', () => {
  const base = todas[0] as Area
  render(<Rodape areas={[base, { ...base, id: 'outra' }]} />)
  expect(creditosDe().getAllByRole('listitem')).toHaveLength(1)
})

it('inclui os créditos extras das capas sem duplicar', () => {
  const base = todas[0] as Area
  render(<Rodape areas={[base]} creditosExtras={['Foto: Capa', base.credito]} />)
  expect(creditosDe().getAllByRole('listitem')).toHaveLength(2)
  expect(screen.getByText('Foto: Capa')).toBeInTheDocument()
})

it.each([
  ['Tour oficial da MSC', 'https://virtual-tours.msccruises.com/MSC-Divina/en-gb/index.html'],
  ['Búzios', 'https://pt.wikipedia.org/wiki/Arma%C3%A7%C3%A3o_dos_B%C3%BAzios'],
  ['Wikimedia Commons', 'https://commons.wikimedia.org'],
])('link externo "%s" abre em nova aba com rel seguro', (nome, href) => {
  render(<Rodape areas={todas} />)
  const link = screen.getByRole('link', { name: nome })
  expect(link).toHaveAttribute('href', href)
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
})

it('é um footer escuro com a assinatura e o ano', () => {
  render(<Rodape areas={todas} />)
  const rodape = screen.getByRole('contentinfo')
  expect(rodape.querySelector('[data-tema="escuro"]')).toHaveTextContent('MSC Divina')
  expect(rodape).toHaveTextContent('Feito pela família para a família')
  expect(rodape).toHaveTextContent(String(new Date().getFullYear()))
  expect(rodape).toHaveTextContent('MSC Divina')
})
