import { roteiroPadrao, roteiros } from './roteiro'
import { areasDoNavio } from './areas'

test('roteiroPadrao gira de yaw-27,5 a yaw+27,5 e sai em yaw+50 com avanço', () => {
  const r = roteiroPadrao({ id: 'x', yaw: 10 })
  expect(r.areaId).toBe('x')
  expect(r.quadros.map((q) => q.p)).toEqual([0, 0.15, 0.62, 0.78, 1])
  expect(r.quadros.map((q) => q.yaw)).toEqual([-17.5, -17.5, 37.5, 60, 60])
  expect(r.quadros.map((q) => q.pitch)).toEqual([-4, -4, 4, 0, 0])
  expect(r.quadros.map((q) => q.fov)).toEqual([100, 92, 85, 85, 55])
  expect(r.saidaYaw).toBe(60)
})

test('yaw ausente vale 0', () => {
  expect(roteiroPadrao({ id: 'y' }).saidaYaw).toBe(50)
})

test('há um roteiro por área do navio, na mesma ordem', () => {
  expect(roteiros).toHaveLength(14)
  expect(roteiros.map((r) => r.areaId)).toEqual(areasDoNavio.map((a) => a.id))
})
