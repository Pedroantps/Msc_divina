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
    if (a.categoria === 'navio' && a.deck === undefined) erros.push(`deck faltando: ${a.id}`)
    if (!a.credito.trim()) erros.push(`crédito faltando: ${a.id}`)
  }
  return erros
}
