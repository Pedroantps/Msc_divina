import { useEffect, useState } from 'react'
import './ImagemComFallback.css'

interface ImagemComFallbackProps {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'sync' | 'auto'
  /** Atributo DOM em minúsculas: o React 18 não conhece `fetchPriority`. */
  fetchpriority?: 'high' | 'low' | 'auto'
}

export function ImagemComFallback({
  src,
  alt,
  className,
  loading = 'lazy',
  decoding = 'async',
  fetchpriority,
}: ImagemComFallbackProps) {
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    setFalhou(false)
  }, [src])

  if (falhou) {
    return (
      <div
        role="img"
        aria-label={alt}
        data-fallback="true"
        className={['imagem-fallback', className].filter(Boolean).join(' ')}
      >
        <span aria-hidden="true">{alt}</span>
      </div>
    )
  }

  // React 18 avisa com `fetchPriority`; o atributo minúsculo passa direto ao DOM.
  const extras = fetchpriority ? { fetchpriority } : {}

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      {...extras}
      onError={() => setFalhou(true)}
    />
  )
}
