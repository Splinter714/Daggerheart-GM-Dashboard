import { renderHook, act } from '@testing-library/react'
import { useAdversaryAddition, RECENTLY_ADDED_DURATION_MS } from './useAdversaryAddition'

function setup(overrides = {}) {
  const createAdversary = vi.fn()
  const createAdversariesBulk = vi.fn()
  const setNewCards = vi.fn((fn) => fn(new Set()))
  const setRecentlyAddedCards = vi.fn((fn) => fn(new Set()))
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
      setRecentlyAddedCards,
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

  return { result, createAdversary, createAdversariesBulk, onAdversaryAdded, setRecentlyAddedCards }
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

describe('useAdversaryAddition fade-out confirmation pulse (#55)', () => {
  it('flags the added card key in recentlyAddedCards', () => {
    const { result, setRecentlyAddedCards } = setup()
    act(() => result.current({ name: 'Goblin', type: 'Standard' }))
    expect(setRecentlyAddedCards).toHaveBeenCalled()
    const updater = setRecentlyAddedCards.mock.calls[0][0]
    expect(updater(new Set()).has('adversary-Goblin')).toBe(true)
  })

  it('clears the flag again after RECENTLY_ADDED_DURATION_MS', () => {
    vi.useFakeTimers()
    const { result, setRecentlyAddedCards } = setup()
    act(() => result.current({ name: 'Goblin', type: 'Standard' }))
    act(() => vi.advanceTimersByTime(RECENTLY_ADDED_DURATION_MS))
    const lastUpdater = setRecentlyAddedCards.mock.calls.at(-1)[0]
    const seeded = new Set(['adversary-Goblin'])
    expect(lastUpdater(seeded).has('adversary-Goblin')).toBe(false)
    vi.useRealTimers()
  })

  it('is not required — omitting setRecentlyAddedCards does not throw', () => {
    const { result } = setup({ setRecentlyAddedCards: undefined })
    expect(() => act(() => result.current({ name: 'Goblin', type: 'Standard' }))).not.toThrow()
  })
})
