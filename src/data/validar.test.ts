import { validarAreas } from './validar'
import type { Area } from './tipos'

const base: Area = { id: 'teatro', nome: 'Teatro', categoria: 'navio', deck: 6, titulo: 'Onde a noite começa',
  descricao: 'Shows toda noite.', imagem: '/img/teatro.webp', credito: 'Foto: Família' }

it('aceita uma lista válida', () => expect(validarAreas([base])).toEqual([]))
it('acusa id repetido', () =>
  expect(validarAreas([base, { ...base }])).toContain('id repetido: teatro'))
it('acusa id fora de kebab-case', () =>
  expect(validarAreas([{ ...base, id: 'Teatro Pantheon' }])).toContain('id inválido: Teatro Pantheon'))
it('acusa descrição longa', () =>
  expect(validarAreas([{ ...base, descricao: 'x'.repeat(161) }])).toContain('descrição longa: teatro'))
it('acusa imagem que não é webp em /img/', () =>
  expect(validarAreas([{ ...base, imagem: 'teatro.jpg' }])).toContain('imagem inválida: teatro'))
it('acusa área do navio sem deck', () =>
  expect(validarAreas([{ ...base, deck: undefined }])).toContain('deck faltando: teatro'))
it('acusa crédito vazio', () =>
  expect(validarAreas([{ ...base, credito: '' }])).toContain('crédito faltando: teatro'))
it('acusa panorama fora de /pano/ ou não webp', () =>
  expect(validarAreas([{ ...base, panorama: '/img/x.jpg' }])).toContain('panorama inválido: teatro'))
it('aceita panorama válido', () =>
  expect(validarAreas([{ ...base, panorama: '/pano/teatro.webp' }])).toEqual([]))
it('acusa área do navio sem título', () =>
  expect(validarAreas([{ ...base, titulo: undefined }])).toContain('título faltando: teatro'))
