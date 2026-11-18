import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { CHAVE_FAVORITOS, useFavoritos } from './useFavoritos'

const ids = ['teatro', 'spa', 'piscina']

beforeEach(() => localStorage.clear())
afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

it('começa vazio', () => {
  const { result } = renderHook(() => useFavoritos(ids))
  expect(result.current.selecionados).toEqual([])
})

it('alternar marca e desmarca', () => {
  const { result } = renderHook(() => useFavoritos(ids))
  act(() => result.current.alternar('teatro'))
  expect(result.current.selecionados).toEqual(['teatro'])
  act(() => result.current.alternar('teatro'))
  expect(result.current.selecionados).toEqual([])
})

it('mantém a ordem em que foram marcados', () => {
  const { result } = renderHook(() => useFavoritos(ids))
  act(() => result.current.alternar('spa'))
  act(() => result.current.alternar('teatro'))
  expect(result.current.selecionados).toEqual(['spa', 'teatro'])
})

it('salva em localStorage', () => {
  const { result } = renderHook(() => useFavoritos(ids))
  act(() => result.current.alternar('teatro'))
  expect(localStorage.getItem(CHAVE_FAVORITOS)).toBe('["teatro"]')
})

it('restaura do localStorage ao montar', () => {
  localStorage.setItem(CHAVE_FAVORITOS, '["spa","teatro"]')
  const { result } = renderHook(() => useFavoritos(ids))
  expect(result.current.selecionados).toEqual(['spa', 'teatro'])
})

it('ignora ids que não existem mais, duplicados, não-strings e JSON corrompido', () => {
  localStorage.setItem(CHAVE_FAVORITOS, '["teatro","sumiu","teatro",3,null]')
  expect(renderHook(() => useFavoritos(ids)).result.current.selecionados).toEqual(['teatro'])
  localStorage.setItem(CHAVE_FAVORITOS, '{quebrado')
  expect(renderHook(() => useFavoritos(ids)).result.current.selecionados).toEqual([])
  localStorage.setItem(CHAVE_FAVORITOS, '{"a":1}')
  expect(renderHook(() => useFavoritos(ids)).result.current.selecionados).toEqual([])
})

it('limpar desmarca tudo e persiste', () => {
  const { result } = renderHook(() => useFavoritos(ids))
  act(() => result.current.alternar('teatro'))
  act(() => result.current.limpar())
  expect(result.current.selecionados).toEqual([])
  expect(localStorage.getItem(CHAVE_FAVORITOS)).toBe('[]')
})

it('funciona com localStorage bloqueado', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('SecurityError')
  })
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('SecurityError')
  })
  const { result } = renderHook(() => useFavoritos(ids))
  expect(result.current.selecionados).toEqual([])
  act(() => result.current.alternar('teatro'))
  expect(result.current.selecionados).toEqual(['teatro'])
})
