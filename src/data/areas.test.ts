import { validarAreas } from './validar'
import { areasDoNavio } from './areas'
import { lugaresBuzios } from './buzios'

it('o conteúdo real é válido', () =>
  expect(validarAreas([...areasDoNavio, ...lugaresBuzios])).toEqual([]))
it('tem entre 8 e 16 áreas do navio', () => {
  expect(areasDoNavio.length).toBeGreaterThanOrEqual(8)
  expect(areasDoNavio.length).toBeLessThanOrEqual(16)
})
it('toda área do navio tem 360° com pelo menos uma cena', () => {
  for (const a of areasDoNavio) {
    expect(a.panorama, a.id).toBeDefined()
    expect(a.cenas?.length, a.id).toBeGreaterThan(0)
  }
})
it('todo arquivo de imagem e panorama citado existe em public/', () => {
  const existentes = new Set(
    Object.keys(import.meta.glob('../../public/{img,pano,miniatura}/*.webp')).map(k => k.replace('../../public', '')),
  )
  for (const a of [...areasDoNavio, ...lugaresBuzios])
    for (const p of [a.imagem, ...(a.cenas ?? []).flatMap(c => [c.panorama, `/miniatura/${c.id}.webp`])].filter((x): x is string => !!x))
      expect(existentes.has(p), p).toBe(true)
})
it('tem de 3 a 5 lugares em Búzios', () => {
  expect(lugaresBuzios.length).toBeGreaterThanOrEqual(3)
  expect(lugaresBuzios.length).toBeLessThanOrEqual(5)
})
it('nenhuma descrição contém texto provisório', () => {
  for (const a of [...areasDoNavio, ...lugaresBuzios])
    expect(a.descricao.toLowerCase()).not.toContain('provisóri')
})
