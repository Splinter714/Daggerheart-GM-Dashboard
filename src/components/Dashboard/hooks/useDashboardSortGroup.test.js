import { renderHook, act } from '@testing-library/react'
import { useDashboardSortGroup, defaultDirFor, applySort, toAlphabeticLabel, formatInstanceLabel } from './useDashboardSortGroup'

beforeEach(() => localStorage.clear())

describe('defaultDirFor', () => {
  it('defaults numeric "bigger is more relevant" fields to descending', () => {
    expect(defaultDirFor('hp')).toBe('desc')
    expect(defaultDirFor('difficulty')).toBe('desc')
    expect(defaultDirFor('atk')).toBe('desc')
    expect(defaultDirFor('threshold')).toBe('desc')
    expect(defaultDirFor('tier')).toBe('desc')
  })

  it('defaults alphabetical fields to ascending', () => {
    expect(defaultDirFor('name')).toBe('asc')
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

  it('selecting tier starts descending (#114), matching other numeric fields', () => {
    const { result } = renderHook(() => useDashboardSortGroup())

    act(() => result.current.setSortBy('tier'))
    expect(result.current.sortBy).toBe('tier')
    expect(result.current.sortDir).toBe('desc')
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

describe('toAlphabeticLabel (#82)', () => {
  it('converts 1-26 to A-Z', () => {
    expect(toAlphabeticLabel(1)).toBe('A')
    expect(toAlphabeticLabel(2)).toBe('B')
    expect(toAlphabeticLabel(26)).toBe('Z')
  })

  it('wraps past 26 into double letters, spreadsheet-column style', () => {
    expect(toAlphabeticLabel(27)).toBe('AA')
    expect(toAlphabeticLabel(28)).toBe('AB')
    expect(toAlphabeticLabel(52)).toBe('AZ')
    expect(toAlphabeticLabel(53)).toBe('BA')
  })

  it('never runs out — always returns a label for any positive integer', () => {
    expect(toAlphabeticLabel(1000)).toMatch(/^[A-Z]+$/)
  })
})

describe('formatInstanceLabel (#82: numeric stays default, alphabetic is an option)', () => {
  it('defaults to numeric', () => {
    expect(formatInstanceLabel(1, 'numeric')).toBe('1')
    expect(formatInstanceLabel(3, 'numeric')).toBe('3')
  })

  it('formats alphabetically when instanceLabelStyle is "alphabetic"', () => {
    expect(formatInstanceLabel(1, 'alphabetic')).toBe('A')
    expect(formatInstanceLabel(2, 'alphabetic')).toBe('B')
  })

  it('treats a missing/falsy duplicateNumber as 1', () => {
    expect(formatInstanceLabel(undefined, 'numeric')).toBe('1')
    expect(formatInstanceLabel(undefined, 'alphabetic')).toBe('A')
  })
})

describe('useDashboardSortGroup instanceLabelStyle (#82)', () => {
  it('defaults to numeric', () => {
    const { result } = renderHook(() => useDashboardSortGroup())
    expect(result.current.instanceLabelStyle).toBe('numeric')
  })

  it('setInstanceLabelStyle updates the setting and numeric stays available afterward', () => {
    const { result } = renderHook(() => useDashboardSortGroup())

    act(() => result.current.setInstanceLabelStyle('alphabetic'))
    expect(result.current.instanceLabelStyle).toBe('alphabetic')

    act(() => result.current.setInstanceLabelStyle('numeric'))
    expect(result.current.instanceLabelStyle).toBe('numeric')
  })
})
