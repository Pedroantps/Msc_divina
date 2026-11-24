import type { Area } from './tipos'

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function validarAreas(areas: Area[]): string[] {
  const erros: string[] = []
  const vistos = new Set<string>()
  for (const a of areas) {
    if (vistos.has(a.id)) erros.push(`id repetido: ${a.id}`)
    vistos.add(a.id)
    if (!KEBAB.test(a.id)) erros.push(`id inválido: ${a.id}`)
    if (a.descricao.length > 160) erros.push(`descrição longa: ${a.id}`)
    if (!a.imagem.startsWith('/img/') || !a.imagem.endsWith('.webp')) erros.push(`imagem inválida: ${a.id}`)
    if (a.panorama !== undefined && (!a.panorama.startsWith('/pano/') || !a.panorama.endsWith('.webp'))) erros.push(`panorama inválido: ${a.id}`)
    if (a.categoria === 'navio' && !a.titulo?.trim()) erros.push(`título faltando: ${a.id}`)
    if (a.titulo && a.titulo.length > 40) erros.push(`título longo: ${a.id}`)
    // Uma área espalhada pelo navio (ex.: cabines) pode não ter deck único, desde que tenha cenas.
    if (a.categoria === 'navio' && a.deck === undefined && !a.cenas?.length) erros.push(`deck faltando: ${a.id}`)
    const cenasVistas = new Set<string>()
    for (const c of a.cenas ?? []) {
      if (cenasVistas.has(c.id)) erros.push(`cena repetida: ${a.id}/${c.id}`)
      cenasVistas.add(c.id)
      if (!c.panorama.startsWith('/pano/') || !c.panorama.endsWith('.webp')) erros.push(`panorama inválido: ${a.id}/${c.id}`)
      if (c.yaw < -180 || c.yaw > 180) erros.push(`yaw fora de -180..180: ${a.id}/${c.id}`)
    }
    if (a.cenas?.length && a.panorama !== a.cenas[0].panorama) erros.push(`panorama diferente da primeira cena: ${a.id}`)
    if (!a.credito.trim()) erros.push(`crédito faltando: ${a.id}`)
  }
  return erros
}
