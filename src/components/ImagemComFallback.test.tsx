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

it('repassa srcSet e sizes para a imagem', () => {
  render(<ImagemComFallback src="/a.webp" alt="Teatro" srcSet="/p.webp 640w, /a.webp 1920w" sizes="50vw" />)
  const img = screen.getByRole('img')
  expect(img).toHaveAttribute('srcset', '/p.webp 640w, /a.webp 1920w')
  expect(img).toHaveAttribute('sizes', '50vw')
})

it('carrega de forma preguiçosa e assíncrona por padrão', () => {
  render(<ImagemComFallback src="/a.webp" alt="Teatro" />)
  const img = screen.getByRole('img')
  expect(img).toHaveAttribute('loading', 'lazy')
  expect(img).toHaveAttribute('decoding', 'async')
  expect(img).not.toHaveAttribute('fetchpriority')
})

it('aceita sobrescrever loading, decoding e fetchpriority', () => {
  render(<ImagemComFallback src="/a.webp" alt="Teatro" loading="eager" decoding="auto" fetchpriority="high" />)
  const img = screen.getByRole('img')
  expect(img).toHaveAttribute('loading', 'eager')
  expect(img).toHaveAttribute('decoding', 'auto')
  expect(img).toHaveAttribute('fetchpriority', 'high')
})
