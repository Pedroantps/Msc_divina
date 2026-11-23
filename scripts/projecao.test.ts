// @ts-expect-error módulo .mjs sem tipos
import { cilindrica, lonLatParaPixel, perspectiva } from './projecao.mjs'

const graus = (r: number) => (r * 180) / Math.PI

it('o centro da saída olha para o yaw pedido, no horizonte', () => {
  for (const proj of [cilindrica, perspectiva]) {
    const mapa = proj({ yaw: 40, campo: 90, largura: 400, altura: 200 })
    const [lon, lat] = mapa(199.5, 99.5)
    expect(graus(lon)).toBeCloseTo(40, 5)
    expect(graus(lat)).toBeCloseTo(0, 5)
  }
})

it('a faixa cilíndrica cobre exatamente o campo pedido', () => {
  const mapa = cilindrica({ yaw: 0, campo: 150, largura: 3000, altura: 1000 })
  const [esq] = mapa(-0.5, 500)
  const [dir] = mapa(2999.5, 500)
  expect(graus(dir - esq)).toBeCloseTo(150, 5)
})

it('lon 0 cai no meio do equirretangular e a costura dá a volta', () => {
  expect(lonLatParaPixel(0, 0, 4096, 2048)[0]).toBeCloseTo(2047.5, 5)
  expect(lonLatParaPixel(Math.PI * 1.5, 0, 4096, 2048)[0]).toBeCloseTo(lonLatParaPixel(-Math.PI / 2, 0, 4096, 2048)[0], 5)
})
