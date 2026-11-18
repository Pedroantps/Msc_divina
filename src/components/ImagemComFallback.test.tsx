import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { ImagemComFallback } from './ImagemComFallback'

it('troca por bloco de cor quando a imagem falha', () => {
  render(<ImagemComFallback src="/img/nao-existe.webp" alt="Teatro" />)
  fireEvent.error(screen.getByRole('img', { name: 'Teatro' }))
  const bloco = screen.getByRole('img', { name: 'Teatro' })
  expect(bloco).toHaveAttribute('data-fallback', 'true')
  expect(bloco).toHaveTextContent('Teatro')
})

it('volta a tentar a imagem quando o src muda', () => {
  const { rerender } = render(<ImagemComFallback src="/a.webp" alt="Teatro" />)
  fireEvent.error(screen.getByRole('img', { name: 'Teatro' }))
  rerender(<ImagemComFallback src="/b.webp" alt="Teatro" />)
  expect(screen.getByRole('img', { name: 'Teatro' })).not.toHaveAttribute('data-fallback')
})

it('repassa a className para a imagem e para o fallback', () => {
  render(<ImagemComFallback src="/a.webp" alt="Teatro" className="x" />)
  expect(screen.getByRole('img')).toHaveClass('x')
  fireEvent.error(screen.getByRole('img'))
  expect(screen.getByRole('img')).toHaveClass('x')
})
