import { renderHook, act } from '@testing-library/react'
import { useDashboardSortGroup, defaultDirFor, applySort } from './useDashboardSortGroup'

beforeEach(() => localStorage.clear())

describe('defaultDirFor', () => {
  it('defaults numeric "bigger is more relevant" fields to descending', () => {
    expect(defaultDirFor('hp')).toBe('desc')
    expect(defaultDirFor('difficulty')).toBe('desc')
    expect(defaultDirFor('atk')).toBe('desc')
    expect(defaultDirFor('threshold')).toBe('desc')
  })

  it('defaults alphabetical/ordinal fields to ascending', () => {
    expect(defaultDirFor('name')).toBe('asc')
    expect(defaultDirFor('tier')).toBe('asc')
    expect(defaultDirFor('type')).toBe('asc')
  })

  it('falls back to ascending for an unknown field', () => {
    expect(defaultDirFor('nonsense')).toBe('asc')
  })
})

describe('useDashboardSortGroup', () => {
  it('selecting a new field starts at that field\'s default direction', () => {
    const { result } = renderHook(() => useDashboardSortGroup())

    act(() => result.current.setSortBy('hp'))
    expect(result.current.sortBy).toBe('hp')
    expect(result.current.sortDir).toBe('desc')

    act(() => result.current.setSortBy('name'))
    expect(result.current.sortBy).toBe('name')
    expect(result.current.sortDir).toBe('asc')
  })

  it('clicking the same field again toggles direction', () => {
    const { result } = renderHook(() => useDashboardSortGroup())

    act(() => result.current.setSortBy('hp'))
    expect(result.current.sortDir).toBe('desc')

    act(() => result.current.setSortBy('hp'))
    expect(result.current.sortDir).toBe('asc')

    act(() => result.current.setSortBy('hp'))
    expect(result.current.sortDir).toBe('desc')
  })
})

describe('applySort with hp default direction', () => {
  it('sorts groups by hpMax descending when sortDir is desc', () => {
    const groups = [
      { baseName: 'a', hpMax: 5 },
      { baseName: 'b', hpMax: 20 },
      { baseName: 'c', hpMax: 10 },
    ]
    const sorted = applySort(groups, 'hp', 'desc', 'type')
    expect(sorted.map(g => g.hpMax)).toEqual([20, 10, 5])
  })
})

describe('grouping is always on (#106: "none" removed)', () => {
  it('defaults groupBy to "type", not "none"', () => {
    const { result } = renderHook(() => useDashboardSortGroup())
    expect(result.current.groupBy).toBe('type')
  })

  it('applySort always groups by type/tier first, even with no explicit groupBy argument', () => {
    const groups = [
      { baseName: 'a', type: 'Bruiser', hpMax: 5 },
      { baseName: 'b', type: 'Minion', hpMax: 20 },
      { baseName: 'c', type: 'Bruiser', hpMax: 10 },
    ]
    const sorted = applySort(groups, 'name', 'asc')
    // Same-type entries land adjacent to each other regardless of name order
    const types = sorted.map(g => g.type)
    expect(types[0]).toBe(types[1])
  })
})
