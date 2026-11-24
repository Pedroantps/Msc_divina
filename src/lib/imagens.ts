import type { Capacidade } from './camera/tipos'

/** srcSet com a variante de 640px (public/img/640) e a original de 1920px. */
export function srcSetDe(imagem: string): string | undefined {
  const m = /^\/img\/([^/]+\.webp)$/.exec(imagem)
  if (!m) return undefined
  return `/img/640/${m[1]} 640w, ${imagem} 1920w`
}

/** Caminho do panorama para a capacidade do aparelho: a média usa a variante 2048 (public/pano/2048). */
export function panoramaPara(caminho: string, capacidade: Capacidade): string {
  if (capacidade !== 'media') return caminho
  return caminho.replace(/^\/pano\/([^/]+)$/, '/pano/2048/$1')
}
