import { panoramaPara } from './imagens'

test('panoramaPara usa a variante 2048 na capacidade média', () => {
  expect(panoramaPara('/pano/reception.webp', 'media')).toBe('/pano/2048/reception.webp')
})

test('panoramaPara mantém o original na alta e no sem3d', () => {
  expect(panoramaPara('/pano/reception.webp', 'alta')).toBe('/pano/reception.webp')
  expect(panoramaPara('/pano/reception.webp', 'sem3d')).toBe('/pano/reception.webp')
})

test('panoramaPara não mexe em caminhos fora de /pano', () => {
  expect(panoramaPara('/img/x.webp', 'media')).toBe('/img/x.webp')
})
