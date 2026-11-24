import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CtaAcento } from './CtaAcento'

it('sem href vira botão com o rótulo como nome', async () => {
  const aoClicar = vi.fn()
  render(<CtaAcento rotulo="Ver em 360°" onClick={aoClicar} />)
  const botao = screen.getByRole('button', { name: 'Ver em 360°' })
  expect(botao).toHaveAttribute('type', 'button')
  await userEvent.click(botao)
  expect(aoClicar).toHaveBeenCalledOnce()
})

it('com href vira link; externo abre em nova aba com rel seguro', () => {
  render(<CtaAcento rotulo="Tour oficial" href="https://exemplo.com" externo />)
  const link = screen.getByRole('link', { name: 'Tour oficial' })
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
})

it('soQuadrado esconde o rótulo só visualmente', () => {
  render(<CtaAcento rotulo="Favoritar" soQuadrado pressionado={false} />)
  const botao = screen.getByRole('button', { name: 'Favoritar' })
  expect(botao).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByText('Favoritar')).toHaveClass('visualmente-oculto')
})

it('repassa a ref para o elemento (para devolver o foco ao fechar um modal)', () => {
  const ref = createRef<HTMLAnchorElement | HTMLButtonElement>()
  render(<CtaAcento ref={ref} rotulo="Ver em 360°" />)
  expect(ref.current).toBe(screen.getByRole('button'))
})
