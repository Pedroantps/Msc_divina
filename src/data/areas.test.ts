import { validarAreas } from './validar'
import { areasDoNavio } from './areas'
import { lugaresBuzios } from './buzios'

it('o conteúdo real é válido', () =>
  expect(validarAreas([...areasDoNavio, ...lugaresBuzios])).toEqual([]))
it('tem entre 8 e 10 áreas do navio', () => {
  expect(areasDoNavio.length).toBeGreaterThanOrEqual(8)
  expect(areasDoNavio.length).toBeLessThanOrEqual(10)
})
it('tem de 2 a 3 panoramas', () => {
  const n = areasDoNavio.filter(a => a.panorama).length
  expect(n).toBeGreaterThanOrEqual(2); expect(n).toBeLessThanOrEqual(3)
})
it('tem de 3 a 5 lugares em Búzios', () => {
  expect(lugaresBuzios.length).toBeGreaterThanOrEqual(3)
  expect(lugaresBuzios.length).toBeLessThanOrEqual(5)
})
