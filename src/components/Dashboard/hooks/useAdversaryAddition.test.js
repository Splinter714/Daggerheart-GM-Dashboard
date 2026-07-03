import { renderHook, act } from '@testing-library/react'
import { useAdversaryAddition } from './useAdversaryAddition'

function setup(overrides = {}) {
  const createAdversary = vi.fn()
  const createAdversariesBulk = vi.fn()
  const setNewCards = vi.fn((fn) => fn(new Set()))
  const onAdversaryAdded = vi.fn()
  const scrollContainerRef = { current: null }

  const { result } = renderHook(() =>
    useAdversaryAddition({
      entityGroups: [],
      pcCount: 4,
      scrollContainerRef,
      createAdversariesBulk,
      createAdversary,
      setNewCards,
      getEntityGroups: () => [],
      smoothScrollTo: vi.fn(),
      browserOpenAtPosition: null,
      columnWidth: 300,
      sortBy: 'name',
      sortDir: 'asc',
      groupBy: 'none',
      onAdversaryAdded,
      ...overrides,
    })
  )

  return { result, createAdversary, createAdversariesBulk, onAdversaryAdded }
}

describe('useAdversaryAddition onAdversaryAdded callback', () => {
  it('calls onAdversaryAdded with the base name for a single (non-minion) add', () => {
    const { result, onAdversaryAdded } = setup()
    act(() => result.current({ name: 'Goblin', type: 'Standard' }))
    expect(onAdversaryAdded).toHaveBeenCalledWith('Goblin')
  })

  it('strips the "(n)" suffix so the toast reads the base creature name', () => {
    const { result, onAdversaryAdded } = setup()
    act(() => result.current({ name: 'Goblin (2)', type: 'Standard' }))
    expect(onAdversaryAdded).toHaveBeenCalledWith('Goblin')
  })

  it('is not required — omitting it does not throw', () => {
    const { result } = setup({ onAdversaryAdded: undefined })
    expect(() => act(() => result.current({ name: 'Goblin', type: 'Standard' }))).not.toThrow()
  })
})
