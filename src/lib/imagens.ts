/** srcSet com a variante de 640px (public/img/640) e a original de 1920px. */
export function srcSetDe(imagem: string): string | undefined {
  const m = /^\/img\/([^/]+\.webp)$/.exec(imagem)
  if (!m) return undefined
  return `/img/640/${m[1]} 640w, ${imagem} 1920w`
}
