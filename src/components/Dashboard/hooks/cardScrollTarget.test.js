import { getCardScrollTarget } from './cardScrollTarget'
import { DASHBOARD_GAP } from '../constants'

// Builds a fake scroll container + card element pair with just enough of the
// DOM API (getBoundingClientRect, scrollLeft, clientWidth, querySelector) for
// getCardScrollTarget to compute against — this lets us assert scroll math
// against arbitrary "rendered positions" without a real browser layout pass,
// which matters because grouping (#106) means a card's real left offset is
// not a flat index * (columnWidth + gap) formula.
//
// `cardContentLeft` is expressed in *content* coordinates (i.e. the card's
// left edge if the container were scrolled to 0) to mirror how real layout
// works — getBoundingClientRect always reports viewport-relative (post-scroll)
// positions, so the fixture converts content-left -> viewport-relative-left
// using the given scrollLeft, exactly as a real browser would.
function makeContainer({ scrollLeft = 0, clientWidth = 900, containerLeft = 0 } = {}) {
  const cards = new Map()
  const container = {
    scrollLeft,
    clientWidth,
    getBoundingClientRect: () => ({ left: containerLeft }),
    querySelector: (selector) => {
      const match = selector.match(/data-card-key="(.+)"/)
      const key = match?.[1]
      return cards.get(key) ?? null
    },
  }
  const addCard = (key, { left: cardContentLeft, width = 300 }) => {
    const viewportLeft = containerLeft + (cardContentLeft - scrollLeft)
    cards.set(key, { getBoundingClientRect: () => ({ left: viewportLeft, width }) })
  }
  return { container, addCard }
}

describe('getCardScrollTarget', () => {
  it('returns null when the card element cannot be found (not yet rendered)', () => {
    const { container } = makeContainer()
    expect(getCardScrollTarget({ container, cardKey: 'adversary-Ghost', columnWidth: 300 })).toBeNull()
  })

  it('returns null when the card is already fully visible', () => {
    const { container, addCard } = makeContainer({ scrollLeft: 0, clientWidth: 900 })
    addCard('adversary-Goblin', { left: 100, width: 300 }) // within [0, 900]
    expect(getCardScrollTarget({ container, cardKey: 'adversary-Goblin', columnWidth: 300 })).toBeNull()
  })

  it('scrolls right to reveal a card hidden past the right edge', () => {
    const { container, addCard } = makeContainer({ scrollLeft: 0, clientWidth: 900 })
    // card sits well past the visible viewport
    addCard('adversary-Dragon', { left: 1500, width: 300 })
    const target = getCardScrollTarget({ container, cardKey: 'adversary-Dragon', columnWidth: 300 })
    expect(target).not.toBeNull()
    // Card end (1800) should land within the (scrolled) viewport.
    expect(target).toBeGreaterThan(0)
    expect(target + 900).toBeGreaterThanOrEqual(1800 - 10)
  })

  it('scrolls left to reveal a card hidden before the left edge', () => {
    const { container, addCard } = makeContainer({ scrollLeft: 1200, clientWidth: 900 })
    // card sits to the left of the current scroll position
    addCard('adversary-Imp', { left: 200, width: 300 })
    const target = getCardScrollTarget({ container, cardKey: 'adversary-Imp', columnWidth: 300 })
    expect(target).not.toBeNull()
    expect(target).toBeLessThan(1200)
  })

  // #121: Jackson felt landing a hidden-right reveal at the card's leading
  // (left) edge — with a wall of newly-revealed cards trailing off to its
  // right — felt less natural than seeing the card arrive at the rightmost
  // visible position. The container's scroll-padding-right equals
  // DASHBOARD_GAP (see DashboardView.css), so aligning the card's trailing
  // edge to `effectiveWidth - DASHBOARD_GAP` lands on that same
  // scroll-padding boundary, avoiding the #50 post-hoc snap-correction
  // lurch while landing the card rightmost instead of leftmost.
  it('lands the card at the rightmost visible position (trailing-edge snap point) when hidden past the right edge', () => {
    const { container, addCard } = makeContainer({ scrollLeft: 0, clientWidth: 900 })
    addCard('adversary-Dragon', { left: 1500, width: 300 })
    const target = getCardScrollTarget({ container, cardKey: 'adversary-Dragon', columnWidth: 300 })
    const cardEnd = 1500 + 300
    expect(target).toBe(cardEnd - 900 + DASHBOARD_GAP)
  })

  it('lands exactly on the card leading-edge snap point when hidden before the left edge', () => {
    const { container, addCard } = makeContainer({ scrollLeft: 1200, clientWidth: 900 })
    addCard('adversary-Imp', { left: 200, width: 300 })
    const target = getCardScrollTarget({ container, cardKey: 'adversary-Imp', columnWidth: 300 })
    expect(target).toBe(200 - DASHBOARD_GAP)
  })

  it('accounts for the reduced effective width when the browser overlay is open', () => {
    const { container, addCard } = makeContainer({ scrollLeft: 0, clientWidth: 900 })
    // Without the overlay this card is fully visible (ends at 850, inside the
    // 900px viewport); with the overlay open (reserves columnWidth + gap px
    // on the right) that same card falls outside the reduced visible area.
    addCard('adversary-Ogre', { left: 550, width: 300 })
    const withoutOverlay = getCardScrollTarget({
      container, cardKey: 'adversary-Ogre', columnWidth: 300, browserOpenAtPosition: null,
    })
    const withOverlay = getCardScrollTarget({
      container, cardKey: 'adversary-Ogre', columnWidth: 300, browserOpenAtPosition: 3,
    })
    expect(withoutOverlay).toBeNull()
    expect(withOverlay).not.toBeNull()
  })

  it('resolves the correct grouped-position card even when position is not a flat index multiple', () => {
    // Simulates a card nested deep in a grouped section, whose real left
    // offset includes extra section gaps/header space that a flat
    // `index * (columnWidth + gap)` calculation would miss.
    const { container, addCard } = makeContainer({ scrollLeft: 0, clientWidth: 900 })
    const groupedRealLeft = 987 // not a multiple of (columnWidth + gap)
    addCard('adversary-Beastkin', { left: groupedRealLeft, width: 300 })
    const target = getCardScrollTarget({ container, cardKey: 'adversary-Beastkin', columnWidth: 300 })
    expect(target).not.toBeNull()
    expect(target + 900).toBeGreaterThanOrEqual(groupedRealLeft + 300 - 10)
  })
})
