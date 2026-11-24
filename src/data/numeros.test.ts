import { expect, it } from 'vitest'
import { areasDoNavio } from './areas'
import { lugaresBuzios } from './buzios'
import { calcularNumeros } from './numeros'
import type { Area } from './tipos'

const base = { categoria: 'navio', descricao: '', imagem: '', credito: '' } as const

it('calcula os quatro números com dados fictícios', () => {
  const areas: Area[] = [
    {
      ...base,
      id: 'a',
      nome: 'A',
      deck: 5,
      cenas: [
        { id: 'a1', nome: 'A1', panorama: '', yaw: 0, deck: '6–7' },
        { id: 'a2', nome: 'A2', panorama: '', yaw: 0, deck: 'Proa' },
      ],
    },
    { ...base, id: 'b', nome: 'B', deck: '5 e 16' },
    { ...base, id: 'c', nome: 'C' },
  ]
  const lugares: Area[] = [{ ...base, categoria: 'buzios', id: 'l', nome: 'L' }]
  expect(calcularNumeros(areas, lugares)).toEqual([
    { valor: 3, legenda: 'áreas do navio' },
    { valor: 2, legenda: 'ambientes em 360°' },
    { valor: 16, legenda: 'é o deck mais alto' },
    { valor: 1, legenda: 'lugares em Búzios' },
  ])
})

it('ignora texto sem número no deck', () => {
  const areas: Area[] = [{ ...base, id: 'a', nome: 'A', deck: 'Proa' }]
  expect(calcularNumeros(areas, [])[2].valor).toBe(0)
})

it('com os dados reais dá 14, 35, 18 e 4', () => {
  expect(calcularNumeros(areasDoNavio, lugaresBuzios).map((i) => i.valor)).toEqual([14, 35, 18, 4])
})
