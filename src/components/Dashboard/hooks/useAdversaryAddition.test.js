import { renderHook, act } from '@testing-library/react'
import { useAdversaryAddition, RECENTLY_ADDED_DURATION_MS } from './useAdversaryAddition'

// Builds a *real* DOM element (so window.getComputedStyle / .style keep
// working, as the hook touches those directly) with scrollWidth/clientWidth
// and getBoundingClientRect stubbed, plus real child elements carrying
// data-card-key so the scroll-to-reveal logic (which measures actual card
// positions rather than computing a flat index) can query them normally.
function makeScrollContainer({ scrollWidth = 3000, clientWidth = 900, scrollLeft = 0 } = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  Object.defineProperty(container, 'scrollWidth', { value: scrollWidth, configurable: true })
  Object.defineProperty(container, 'clientWidth', { value: clientWidth, configurable: true })
  container.scrollLeft = scrollLeft
  container.getBoundingClientRect = () => ({ left: 0 })

  const addCard = (key, { left, width = 300 }) => {
    const card = document.createElement('div')
    card.setAttribute('data-card-key', key)
    card.getBoundingClientRect = () => ({ left, width })
    container.appendChild(card)
  }
  return { container, addCard }
}

function setup(overrides = {}) {
  const createAdversary = vi.fn()
  const createAdversariesBulk = vi.fn()
  const setNewCards = vi.fn((fn) => fn(new Set()))
  const setRecentlyAddedCards = vi.fn((fn) => fn(new Map()))
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

  return { result, createAdversary, createAdversariesBulk, onAdversaryAdded, setRecentlyAddedCards, scrollContainerRef }
}

describe('useAdversaryAddition onAdversaryAdded callback', () => {
  // These tests don't attach a real scrollContainerRef.current, so the
  // hook's internal scroll-scheduling setTimeout(50) is a no-op — but it's
  // still a pending real timer when the test ends. Fake timers here let us
  // flush it deterministically instead of leaving it to fire later against
  // a torn-down jsdom environment (where requestAnimationFrame no longer
  // exists), which vitest reports as an unhandled error.
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('calls onAdversaryAdded with the base name for a single (non-minion) add', () => {
    const { result, onAdversaryAdded } = setup()
    act(() => result.current({ name: 'Goblin', type: 'Standard' }))
    act(() => { vi.advanceTimersByTime(200) })
    expect(onAdversaryAdded).toHaveBeenCalledWith('Goblin')
  })

  it('strips the "(n)" suffix so the toast reads the base creature name', () => {
    const { result, onAdversaryAdded } = setup()
    act(() => result.current({ name: 'Goblin (2)', type: 'Standard' }))
    act(() => { vi.advanceTimersByTime(200) })
    expect(onAdversaryAdded).toHaveBeenCalledWith('Goblin')
  })

  it('is not required — omitting it does not throw', () => {
    const { result } = setup({ onAdversaryAdded: undefined })
    expect(() => act(() => result.current({ name: 'Goblin', type: 'Standard' }))).not.toThrow()
    act(() => { vi.advanceTimersByTime(200) })
  })
})

describe('useAdversaryAddition fade-out confirmation pulse (#55)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('flags the added card key in recentlyAddedCards with a pulse token', () => {
    const { result, setRecentlyAddedCards } = setup()
    act(() => result.current({ name: 'Goblin', type: 'Standard' }))
    expect(setRecentlyAddedCards).toHaveBeenCalled()
    const updater = setRecentlyAddedCards.mock.calls[0][0]
    const next = updater(new Map())
    expect(next.has('adversary-Goblin')).toBe(true)
    expect(typeof next.get('adversary-Goblin')).toBe('number')
    act(() => { vi.advanceTimersByTime(RECENTLY_ADDED_DURATION_MS + 200) })
  })

  it('clears the flag again after RECENTLY_ADDED_DURATION_MS', () => {
    const { result, setRecentlyAddedCards } = setup()
    act(() => result.current({ name: 'Goblin', type: 'Standard' }))
    const [firstUpdater] = setRecentlyAddedCards.mock.calls[0]
    const seeded = firstUpdater(new Map())
    act(() => vi.advanceTimersByTime(RECENTLY_ADDED_DURATION_MS))
    const lastUpdater = setRecentlyAddedCards.mock.calls.at(-1)[0]
    expect(lastUpdater(seeded).has('adversary-Goblin')).toBe(false)
    act(() => { vi.advanceTimersByTime(200) })
  })

  it('is not required — omitting setRecentlyAddedCards does not throw', () => {
    const { result } = setup({ setRecentlyAddedCards: undefined })
    expect(() => act(() => result.current({ name: 'Goblin', type: 'Standard' }))).not.toThrow()
    act(() => { vi.advanceTimersByTime(RECENTLY_ADDED_DURATION_MS + 200) })
  })

  // #55 round 3 (2026-07-05 playtest): the pulse must restart even when a
  // second instance of an already-present type is added before the first
  // instance's pulse has finished — a Set (or unchanged flag) would leave the
  // card's className identical across both adds, so the CSS animation never
  // actually replayed even though the code "fired" on every add.
  it('bumps the pulse token on a second add for the same card while the first pulse is still active, and a stale clear does not erase it', () => {
    // Simulates real setState semantics: each updater fn is applied in order
    // against an accumulating Map, just like React would.
    let state = new Map()
    const setRecentlyAddedCards = vi.fn((updater) => { state = updater(state) })
    const { result } = renderHook(() =>
      useAdversaryAddition({
        entityGroups: [],
        pcCount: 4,
        scrollContainerRef: { current: null },
        createAdversariesBulk: vi.fn(),
        createAdversary: vi.fn(),
        setNewCards: vi.fn(),
        setRecentlyAddedCards,
        getEntityGroups: () => [],
        smoothScrollTo: vi.fn(),
        browserOpenAtPosition: null,
        columnWidth: 300,
        sortBy: 'name',
        sortDir: 'asc',
        groupBy: 'none',
        onAdversaryAdded: undefined,
      })
    )

    act(() => result.current({ name: 'Goblin', type: 'Standard' }))
    const firstToken = state.get('adversary-Goblin')
    expect(firstToken).toBeDefined()

    act(() => { vi.advanceTimersByTime(100) }) // still well within RECENTLY_ADDED_DURATION_MS
    act(() => result.current({ name: 'Goblin', type: 'Standard' }))
    const secondToken = state.get('adversary-Goblin')
    expect(secondToken).toBeDefined()
    expect(secondToken).not.toBe(firstToken) // a fresh token forces the CSS animation to restart

    // Advance to when the FIRST add's clear would fire (but not the second's) —
    // it must be a no-op since a newer token has since been set.
    act(() => { vi.advanceTimersByTime(RECENTLY_ADDED_DURATION_MS - 100) })
    expect(state.has('adversary-Goblin')).toBe(true)
    expect(state.get('adversary-Goblin')).toBe(secondToken)

    // The second add's own clear does eventually fire.
    act(() => { vi.advanceTimersByTime(300) })
    expect(state.has('adversary-Goblin')).toBe(false)
  })
})

// #50: auto-scroll to reveal a newly added card. These resolve the scroll
// target from the card's *measured* DOM position (via data-card-key) rather
// than a flat index — the only way to be correct once grouping (#106) can
// insert extra section gaps/headers that shift a card's real position.
describe('useAdversaryAddition scroll-to-reveal (#50)', () => {
  it('scrolls to bring a newly added card into view in grouped/sorted mode when off-screen', () => {
    vi.useFakeTimers()
    const smoothScrollTo = vi.fn()
    const scrollContainerRef = { current: null }
    const { container, addCard } = makeScrollContainer({ scrollWidth: 3000, clientWidth: 900, scrollLeft: 0 })
    // Card renders far outside the visible viewport — simulates a grouped
    // section pushing it well past what a flat-index estimate would predict.
    addCard('adversary-Beastkin', { left: 1800, width: 300 })
    scrollContainerRef.current = container

    const { result } = renderHook(() =>
      useAdversaryAddition({
        entityGroups: [], // no existing group -> isNewAdversary
        pcCount: 4,
        scrollContainerRef,
        createAdversariesBulk: vi.fn(),
        createAdversary: vi.fn(),
        setNewCards: vi.fn(),
        setRecentlyAddedCards: vi.fn(),
        getEntityGroups: () => [],
        smoothScrollTo,
        browserOpenAtPosition: null,
        columnWidth: 300,
        sortBy: 'name',
        sortDir: 'asc',
        groupBy: 'name', // non-default order -> grouped/sorted scroll branch
        onAdversaryAdded: undefined,
      })
    )

    act(() => {
      result.current({ name: 'Beastkin', type: 'Standard' })
    })
    act(() => { vi.advanceTimersByTime(200) })

    expect(smoothScrollTo).toHaveBeenCalled()
    const [targetScroll] = smoothScrollTo.mock.calls.at(-1)
    expect(targetScroll + 900).toBeGreaterThanOrEqual(1800 - 10)
    vi.useRealTimers()
  })

  it('computes a scroll target via getCardScrollTarget for an existing group receiving a new instance', () => {
    vi.useFakeTimers()
    const smoothScrollTo = vi.fn()
    const scrollContainerRef = { current: null }
    const { container, addCard } = makeScrollContainer({ scrollWidth: 3000, clientWidth: 900, scrollLeft: 0 })
    addCard('adversary-Goblin', { left: 1500, width: 300 })
    scrollContainerRef.current = container

    const { result } = renderHook(() =>
      useAdversaryAddition({
        entityGroups: [{ baseName: 'Goblin', type: 'adversary' }], // existing group -> not a new adversary
        pcCount: 4,
        scrollContainerRef,
        createAdversariesBulk: vi.fn(),
        createAdversary: vi.fn(),
        setNewCards: vi.fn(),
        setRecentlyAddedCards: vi.fn(),
        getEntityGroups: () => [],
        smoothScrollTo,
        browserOpenAtPosition: null,
        columnWidth: 300,
        sortBy: 'name',
        sortDir: 'asc',
        groupBy: 'none',
        onAdversaryAdded: undefined,
      })
    )

    act(() => {
      result.current({ name: 'Goblin', type: 'Standard' })
    })
    act(() => { vi.advanceTimersByTime(200) })

    expect(smoothScrollTo).toHaveBeenCalled()
    const [targetScroll] = smoothScrollTo.mock.calls.at(-1)
    // Card ends at 1800; target scroll should bring that edge into the 900px viewport.
    expect(targetScroll + 900).toBeGreaterThanOrEqual(1800 - 10)
    vi.useRealTimers()
  })

  it('does not scroll when the newly-added card is already visible', () => {
    vi.useFakeTimers()
    const smoothScrollTo = vi.fn()
    const scrollContainerRef = { current: null }
    const { container, addCard } = makeScrollContainer({ scrollWidth: 3000, clientWidth: 900, scrollLeft: 0 })
    addCard('adversary-Goblin', { left: 100, width: 300 }) // within viewport
    scrollContainerRef.current = container

    const { result } = renderHook(() =>
      useAdversaryAddition({
        entityGroups: [{ baseName: 'Goblin', type: 'adversary' }],
        pcCount: 4,
        scrollContainerRef,
        createAdversariesBulk: vi.fn(),
        createAdversary: vi.fn(),
        setNewCards: vi.fn(),
        setRecentlyAddedCards: vi.fn(),
        getEntityGroups: () => [],
        smoothScrollTo,
        browserOpenAtPosition: null,
        columnWidth: 300,
        sortBy: 'name',
        sortDir: 'asc',
        groupBy: 'none',
        onAdversaryAdded: undefined,
      })
    )

    act(() => {
      result.current({ name: 'Goblin', type: 'Standard' })
    })
    act(() => { vi.advanceTimersByTime(200) })

    expect(smoothScrollTo).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
