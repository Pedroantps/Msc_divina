import { roteiroPadrao, roteiros } from './roteiro'
import { areasDoNavio } from './areas'

test('roteiroPadrao gira de yaw-35 a yaw+35 e sai em yaw+60 com avanço', () => {
  const r = roteiroPadrao({ id: 'x', yaw: 10 })
  expect(r.areaId).toBe('x')
  expect(r.quadros.map((q) => q.p)).toEqual([0, 0.15, 0.7, 0.85, 1])
  expect(r.quadros.map((q) => q.yaw)).toEqual([-25, -25, 45, 70, 70])
  expect(r.quadros.map((q) => q.pitch)).toEqual([-4, -4, 4, 0, 0])
  expect(r.quadros.map((q) => q.fov)).toEqual([110, 95, 85, 85, 55])
  expect(r.saidaYaw).toBe(70)
})

test('yaw ausente vale 0', () => {
  expect(roteiroPadrao({ id: 'y' }).saidaYaw).toBe(60)
})

test('há um roteiro por área do navio, na mesma ordem', () => {
  expect(roteiros).toHaveLength(14)
  expect(roteiros.map((r) => r.areaId)).toEqual(areasDoNavio.map((a) => a.id))
})
