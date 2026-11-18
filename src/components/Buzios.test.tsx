import { render, screen } from '@testing-library/react'
import { lugaresBuzios } from '../data/buzios'
import { Buzios } from './Buzios'

it('abre com título e aviso de horário de volta', () => {
  render(<Buzios lugares={lugaresBuzios} />)
  expect(screen.getByRole('heading', { level: 2, name: 'Um dia em Búzios' })).toBeInTheDocument()
  expect(screen.getByText('Volta ao navio antes das 16h (confirme no seu bilhete).')).toBeInTheDocument()
})

it('mostra todos os lugares', () => {
  render(<Buzios lugares={lugaresBuzios} />)
  lugaresBuzios.forEach((l) => expect(screen.getByRole('heading', { name: l.nome })).toBeInTheDocument())
})

it('é uma região nomeada pelo título', () => {
  render(<Buzios lugares={lugaresBuzios} />)
  expect(screen.getByRole('region', { name: 'Um dia em Búzios' })).toBeInTheDocument()
})
