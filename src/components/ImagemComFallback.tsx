import { useEffect, useState } from 'react'
import './ImagemComFallback.css'

interface ImagemComFallbackProps {
  src: string
  alt: string
  className?: string
}

export function ImagemComFallback({ src, alt, className }: ImagemComFallbackProps) {
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

  return <img className={className} src={src} alt={alt} onError={() => setFalhou(true)} />
}
