import { useCallback, useEffect, useRef, useState } from 'react'

export const CHAVE_FAVORITOS = 'divina:favoritos'

function ler(idsValidos: string[]): string[] {
  try {
    const bruto = localStorage.getItem(CHAVE_FAVORITOS)
    if (!bruto) return []
    const dados: unknown = JSON.parse(bruto)
    if (!Array.isArray(dados)) return []
    const vistos = new Set<string>()
    for (const item of dados) {
      if (typeof item === 'string' && idsValidos.includes(item)) vistos.add(item)
    }
    return [...vistos]
  } catch {
    return []
  }
}

function salvar(ids: string[]) {
  try {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(ids))
  } catch {
    // armazenamento indisponível: segue só em memória
  }
}

export function useFavoritos(idsValidos: string[]) {
  const [selecionados, setSelecionados] = useState<string[]>(() => ler(idsValidos))
  const primeira = useRef(true)

  useEffect(() => {
    if (primeira.current) {
      primeira.current = false
      return
    }
    salvar(selecionados)
  }, [selecionados])

  const alternar = useCallback((id: string) => {
    setSelecionados((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]))
  }, [])

  const limpar = useCallback(() => setSelecionados([]), [])

  return { selecionados, alternar, limpar }
}
